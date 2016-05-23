from functools import wraps

import aiohttp
import sqlalchemy as sa


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
        self.settings = settings
        self.try_to_split('columns_to_extract')
        self.interval = self.settings['interval']
        # self.columns_to_extract = self.settings['columns_to_extract'].split(' ')
        self.columns_to_display = self.settings['columns_to_display'].split(' ')
        self.sort_by = self.settings['sort_by'].split(' ') if self.settings['sort_by'] is not None else []
        self.sort_asc = self.settings['sort_asc']
        self.rating_release = self.settings['rating_release']
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

    async def update_table(self):
        raw = await self.get_spreadsheet()
        if self.rating_release:
            await self.add_rating(raw)
        self.table = self.build_html_table(raw)

        return self.table

    async def get_spreadsheet(self):
        spreadsheet = self.gspread.open_by_key(self.settings['url'])
        if self.settings['sheet']:
            records = spreadsheet.worksheet(self.settings['sheet']).get_all_records()
        else:
            records = spreadsheet.sheet1.get_all_records()
        records = [{k.lower(): v for k, v in _dict.items()} for _dict in records]
        return self.filter_dict(records, self.columns_to_extract + self.sort_by + self.check)

    async def add_rating(self, raw_table):
        for team in raw_table:
            team['рейтинг'] = await self.get_rating_position(team['id'], self.rating_release)

    @staticmethod
    async def get_rating_position(team_id, release):
        with aiohttp.ClientSession() as session:
            url = 'http://rating.chgk.info/api/teams/{id}/rating/{release}.json'.format(
                id=team_id, release=release)
            async with session.get(url) as response:
                result = await response.json()
                return result['rating_position']

    @staticmethod
    def key_to_number(key):
        def result(item):
            return item[key] if item[key] != '' else 0

        return result

    def build_html_table(self, records):
        for key, order in zip(reversed(self.sort_by), reversed(self.sort_asc)):
            records.sort(key=self.key_to_number(key), reverse=order)

        records = self.filter_dict(records, self.columns_to_display)
        records = enumerate(records, start=1)
        result = map(self.build_row, records)
        return ''.join(result)

    def build_row(self, record):
        number, row = record
        values = [row[column] for column in self.columns_to_display]
        result = ['<tr>', self.build_cell(number), ''.join(map(self.build_cell, values)), '</tr>']
        return ''.join(result)

    @add_italic
    def build_cell(self, value):
        return '<td>' + str(value) + '</td>'

    @staticmethod
    def filter_dict(list_of_dicts, fields):
        return [{k: v for (k, v) in _dict.items() if k in fields} for _dict in list_of_dicts]
