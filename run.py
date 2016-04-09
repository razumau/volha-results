import asyncio
import json
import ssl

import aiohttp_cors
import gspread as gs
import sqlalchemy as sa
from aiohttp import web
from aiopg.sa import create_engine
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from oauth2client.client import SignedJwtAssertionCredentials

from table import Table, configs

INTERVAL = 2


def init_gspread():
    json_key = json.load(open('credentials.json'))
    scope = ['https://spreadsheets.google.com/feeds']
    credentials = SignedJwtAssertionCredentials(json_key['client_email'],
                                                json_key['private_key'].encode(), scope)
    return gs.authorize(credentials)


async def get_tables(gspread):
    result = {}
    credentials = json.load(open('credentials.json'))
    engine = await create_engine(host='127.0.0.1', database='volha', user='admin',
                                 password=credentials['postgres_password'])
    async with engine:
        async with engine.acquire() as conn:
            query = sa.select('*', ).select_from(configs)
            async for row in conn.execute(query):
                result[row.url] = Table(dict(row), gspread)
    return result


def schedule_tables_update(list_of_tables):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(update_tables(list_of_tables))


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

    scheduler = AsyncIOScheduler()
    scheduler.add_job(schedule_tables_update, trigger='interval', minutes=INTERVAL,
                      args=(list_of_tables,))
    scheduler.start()

    sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
    sslcontext.load_cert_chain('unified.crt', 'private.key')
    app = web.Application()
    app['list_of_tables'] = list_of_tables
    cors = aiohttp_cors.setup(app)
    resource = cors.add(app.router.add_resource("/table/{table_url}"))
    cors.add(resource.add_route('GET', get_html_table), {
        "*": aiohttp_cors.ResourceOptions()
    })
    web.run_app(app, ssl_context=sslcontext)


if __name__ == '__main__':
    main()
