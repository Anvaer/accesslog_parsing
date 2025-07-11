# accesslog_parsing

#### args:
| # | description | default |
|---|-------------|---------|
| 1 | log file name | *mandatory* |
| 2 | minimum count to output | 1000 |
| 3 | minimum number of distinct values to replace with * | 100 |
| 4 | min frequency of occurence to keep the value | 0.05 |

#### example:
```
>node parsing_stats.js access.log 5000
building tree: 1.929s
parsed 580289 rows
reducing tree: 20.074s
72342 : GET /*
51902 : GET /customer/section/load/?sections=
26544 : GET /
17759 : GET /*?srsltid=*
13330 : GET /rest/V1/carts/*/totals
10209 : GET /rest/V1/carts/*
9460 : GET /*/cart/index/
9410 : GET /catalog/product/view/id/*?product=*&utm_source=google&utm_medium=organic&utm_campaign=surfaces-across-google&utm_term=*
8425 : GET /*/rest/V1/stockItems/*
7848 : GET /equipment/items?item_series=*&item_size=*&cat=19&item_weight=7807
7810 : GET /equipment/items/*?item_size=*&cat=21
6877 : GET /rest/V1/stockStatuses/*?scopeId=1
6788 : GET /rest/V1/bolt/boltpay/carts/*/cartid
6371 : GET /*/*
65997 : POST /graphql
8777 : POST /reclaim/checkout/reload?form_key=*
6085 : POST /checkout/cart/add/uenc/*/product/*/
printing tree: 184.234ms
```
