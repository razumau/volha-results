create table if not exists tables(
id serial unique,
url text,
interval integer,
sheet text,
columns_to_extract text,
columns_to_display text,
sort_by text,
sort_asc boolean,
rating_release integer,
check_column text
)

