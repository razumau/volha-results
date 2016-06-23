import asyncio
import json

import aiohttp_cors

import sqlalchemy as sa
from aiohttp import web
from aiopg.sa import create_engine
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from table import Table, configs

INTERVAL = 2


async def get_tables():
    result = {}
    credentials = json.load(open('credentials.json'))
    engine = await create_engine(host=credentials['postgres_host'], database='volha', user='admin',
                                 password=credentials['postgres_password'])
    async with engine:
        async with engine.acquire() as conn:
            query = sa.select('*', ).select_from(configs)
            async for row in conn.execute(query):
                result[row.url] = Table(dict(row))
    return result


def schedule_tables_update(list_of_tables):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(update_tables(list_of_tables))


async def update_tables(list_of_tables):
    for _, t in list_of_tables.items():
        await t.update_table()


async def get_html_table(request):
    requested_table = request.app['list_of_tables'][request.match_info['table_url']]
    return web.Response(text=await requested_table.get_html_table())


def main():
    loop = asyncio.get_event_loop()

    list_of_tables = loop.run_until_complete(get_tables())
    loop.run_until_complete(update_tables(list_of_tables))

    scheduler = AsyncIOScheduler()
    scheduler.add_job(schedule_tables_update, trigger='interval', minutes=INTERVAL,
                      args=(list_of_tables,))
    scheduler.start()

    # sslcontext = ssl.SSLContext(ssl.PROTOCOL_SSLv23)
    # sslcontext.load_cert_chain('unified.crt', 'private.key')
    app = web.Application()
    app['list_of_tables'] = list_of_tables
    cors = aiohttp_cors.setup(app)
    resource = cors.add(app.router.add_resource("/table/{table_url}"))
    cors.add(resource.add_route('GET', get_html_table), {
        "*": aiohttp_cors.ResourceOptions()
    })
    web.run_app(app)#, ssl_context=sslcontext)


if __name__ == '__main__':
    main()
