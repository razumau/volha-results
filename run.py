import asyncio
import json
from aiohttp import web
from functools import partial

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


async def update_tables(list_of_tables):
    for _, t in list_of_tables.items():
        await t.update_table()


async def get_html_table(request):
    requested_table = request.app['list_of_tables'][request.match_info['table_url']]
    return web.Response(text=await requested_table.get_html_table())


def main():
    loop = asyncio.get_event_loop()

    list_of_tables = loop.run_until_complete(get_tables(init_gspread()))
    loop.run_until_complete(update_tables(list_of_tables))

    app = web.Application()
    app['list_of_tables'] = list_of_tables
    app.router.add_route('GET', '/table/{table_url}', get_html_table)
    web.run_app(app)


if __name__ == '__main__':
    main()
