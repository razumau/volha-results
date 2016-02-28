import asyncio
import json

import gspread as gs
import sqlalchemy as sa
from aiopg.sa import create_engine
from oauth2client.client import SignedJwtAssertionCredentials

from table import Table, configs


def init_gspread():
    json_key = json.load(open('credentials.json'))
    scope = ['https://spreadsheets.google.com/feeds']
    credentials = SignedJwtAssertionCredentials(json_key['client_email'],
                                                json_key['private_key'].encode(), scope)
    return gs.authorize(credentials)


async def get_tables(gspread):
    result = {}
    engine = await create_engine(host='127.0.0.1', database='volha')
    async with engine:
        async with engine.acquire() as conn:
            query = sa.select('*', ).select_from(configs)
            async for row in conn.execute(query):
                result[row.url] = Table(dict(row), gspread)
    return result


def main():
    loop = asyncio.get_event_loop()

    _tables = loop.run_until_complete(get_tables(init_gspread()))
    for url, _table in _tables.items():
        _table.update_table()

        # TODO: start server


if __name__ == '__main__':
    main()
