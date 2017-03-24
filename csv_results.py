import logging
import configparser
import csv
import json
import boto
import boto.s3
from boto.s3.key import Key

import gspread as gs
from oauth2client.client import SignedJwtAssertionCredentials

config = configparser.ConfigParser()
config.read('config.conf')


def init_gspread():
    json_key = json.load(open('credentials.json'))
    scope = ['https://spreadsheets.google.com/feeds']
    credentials = SignedJwtAssertionCredentials(json_key['client_email'],
                                                json_key['private_key'].encode(), scope)
    return gs.authorize(credentials)


def save_to_csv(data, fields):
    logging.info('Saving to CSV')
    filename = 'volha.csv'
    with open(filename, 'w') as output_file:
        dict_writer = csv.DictWriter(output_file, fields, delimiter=';')
        dict_writer.writeheader()
        dict_writer.writerows(data)
    logging.info('Saved to CSV')
    return filename


def upload_to_s3(filename):
    s3_connection = boto.connect_s3(config['aws']['aws_access_key_id'],
                                   config['aws']['aws_secret_access_key'])
    bucket = s3_connection.get_bucket(config['aws']['bucket'])
    key = boto.s3.key.Key(bucket, filename)
    with open(filename, 'rb') as f:
        key.set_contents_from_file(f)


def empty_to_zero(string):
    return string
    # return 0 if string == '' else string


def filter_dict(list_of_dicts, fields):
    return [{k: empty_to_zero(v) for (k, v) in _dict.items() if k in fields} for _dict in list_of_dicts]


def get_data(fields):
    gspread = init_gspread()
    spreadsheet = gspread.open_by_key(config['spreadsheet']['url'])
    records = spreadsheet.worksheet(config['spreadsheet']['sheet']).get_all_records()
    # print(records)
    return filter_dict(records, fields)[2:]


def main():
    fields = ['Команда'] + [str(n) for n in range(1, 61)]
    data = get_data(fields)
    filename = save_to_csv(data, fields)
    # filename = 'volha.csv'
    upload_to_s3(filename)


if __name__ == '__main__':
    logging.basicConfig(format=f'%(asctime)s %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S',
                        filename='csv_export.log', level=logging.INFO)
    main()
