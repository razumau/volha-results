import aiopg
import aiohttp
from aiopg.sa import create_engine
import sqlalchemy as sa
from operator import attrgetter, itemgetter
from functools import wraps


def add_italic(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            result = func(self, *args, **kwargs)
            return '<i>' + result + '</i>' if self.check else result
        return wrapper

metadata = sa.MetaData()
configs = sa.Table('tables', metadata,
                   sa.Column('id', sa.Integer, primary_key=True),
                   sa.Column('url', sa.String(255)),
                   sa.Column('interval', sa.Integer),
                   sa.Column('sheet', sa.String(255)),
                   sa.Column('columns_to_extract', sa.String(255)),
                   sa.Column('columns_to_display', sa.String(255)),
                   sa.Column('sort_by', sa.String(255)),
                   sa.Column('sort_asc', sa.Boolean),
                   sa.Column('rating_release', sa.Integer),
                   sa.Column('check_column', sa.String(255))
                   )


class Table:
    def __init__(self, settings, gspread):
        # TODO schedule
        # TODO read from postgres
        self.settings = settings
        self.try_to_split('columns_to_extract')
        # self.columns_to_extract = self.settings['columns_to_extract'].split(' ')
        self.columns_to_display = self.settings['columns_to_display'].split(' ')
        self.sort_by = self.settings['sort_by'].split(' ')
        self.sort_asc = self.settings['sort_asc']
        self.check = self.settings['check_column'] if self.settings['check_column'] else []
        self.gspread = gspread
        self.table = None

    async def get_html_table(self):
        return self.table if self.table else await self.update_table()

    def try_to_split(self, column):
        try:
            setattr(self, column, self.settings[column].split(' '))
        except AttributeError:
            setattr(self, column, None)

    def update_table(self):
        raw = self.get_spreadsheet()
        if self.settings['rating_release']:
            self.add_rating(raw)
        self.table = self.build_html_table(raw)
        # await self.save_to_db()
        return self.table

    def get_spreadsheet(self):
        spreadsheet = self.gspread.open_by_key(self.settings['url'])
        if self.settings['sheet']:
            records = spreadsheet.worksheet(self.settings['sheet']).get_all_records()
        else:
            records = spreadsheet.sheet1.get_all_records()
        return self.filter_dict(records, self.columns_to_extract + self.sort_by + self.check)

    @staticmethod
    def add_rating(raw_table):
        # TODO: rating api
        for team in raw_table:
            team['рейтинг'] = team['id']

    def build_html_table(self, records):
        for key, order in zip(self.sort_by, self.sort_asc):
            records.sort(key=itemgetter(key), reverse=order)

        records = enumerate(records, start=1)
        result = map(self.build_row, records)
        return ''.join(result)

    def build_row(self, record):
        number, row = record
        result = ['<tr>', self.build_cell(number), ''.join(map(self.build_cell, row.values())), '</tr>']
        return ''.join(result)

    @add_italic
    def build_cell(self, value):
        return '<td>' + str(value) + '</td>'

    async def save_to_db(self):
        pass

    @staticmethod
    def filter_dict(list_of_dicts, fields):
        return [{k: v for (k, v) in _dict.items() if k in fields} for _dict in list_of_dicts]

    # @classmethod
    # async def create(cls, settings):
    #     self = Table()
    #     self.settings = settings
    #     print(settings)
    #     return self


