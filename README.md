## Description

Polkafantasy launchpad server repository.

## Installation

```bash
$ npm install
```

## Setup
1. Create .env file using env.example

Note: Please set prod-api, prod-worker to NODE_ENV, it'll require KMS service to encrypt and decrypt the private key.

```bash
PORT=3001 # API port

NODE_ENV=dev-worker # dev-api, dev-worker, prod-api, prod-worker

SECRET_KEY=somesercretkey # your secret key, anything is ok

# notification
MAIL_HOST=smtp.gmail.com
MAIL_USER= # gmail account
MAIL_PASS= # gmail application key
MAIL_RECEIVED_ADDRESS= # email address that you want to receive the notification
TELEGRAM_TOKEN= # telegram bot token
TELEGRAM_CHAT_ID= # teleram chat id

# TYPEORM
TYPEORM_CONNECTION=mysql
TYPEORM_HOST=localhost # MySQL host
TYPEORM_PORT=3306 # MySQL port
TYPEORM_USERNAME=root # MySQL username
TYPEORM_PASSWORD=1 # MySQL password
TYPEORM_DATABASE=database_name # schema name
TYPEORM_MIGRATIONS_DIR=src/database/migrations
TYPEORM_MIGRATIONS=dist/database/migrations/*.js
TYPEORM_ENTITIES_DIR=dist/**/*.entity.js
```

2. Create database structure.

Run the app for the first time to create the database structure.

3. Setup currency config
```bash
INSERT INTO currency_config (swap_id,network,chain_name,chain_id,average_block_time,required_confirmations,token_address,rpc_endpoint,explorer_endpoint)
	VALUES (1,'eth','rinkeby','4',15000,12,'{"token": "0x72Ab532e2cb721a87C180B4728Cfa9bd837370e3", "bridge": "0xE9BA8e1cb4d1D8A0d19F09568CAe48F3C99A862B", "lootbox": "0xD950eE84A3aC806B40bA04D862808b788Dca47C1"}','https://rinkeby.infura.io/v3/e087ea9e4af14c99837f2a761fee8857','https://rinkeby.etherscan.io/');
INSERT INTO currency_config (swap_id,network,chain_name,chain_id,average_block_time,required_confirmations,token_address,rpc_endpoint,explorer_endpoint)
	VALUES (2,'bsc','testnet','97',3000,15,'{"token": "0x72Ab532e2cb721a87C180B4728Cfa9bd837370e3", "bridge": "0xa020694Db1f36251162FF96F987CAb96d8D13958", "lootbox": "0x30D4251977Bfe582d8B27dc1c1aDcfadda0CA698"}','https://data-seed-prebsc-1-s1.binance.org:8545/','https://testnet.bscscan.com/');
INSERT INTO currency_config (swap_id,network,chain_name,chain_id,average_block_time,required_confirmations,token_address,rpc_endpoint,explorer_endpoint)
	VALUES (3,'polygon','mumbai','80001',2000,15,'{"lootbox": "0x95a029f26a879b93424bc612908a3bd850841600", "nftToken":"0x02A0Ee05C5bE800F3E553b6bc52ea911c2DDD9f7"}','https://rpc-mumbai.maticvigil.com','https://polygonscan.com/');
INSERT INTO currency_config (swap_id,network,chain_name,chain_id,average_block_time,required_confirmations,token_address,rpc_endpoint,explorer_endpoint)
	VALUES (4,'polygon','mumbai','80001','2000','1','{"treasury": "0xd3aeA8a851fe0929eDc31D33D5a3c33AFc3D884d", "nftLand":"0x2d775e7c197a2a3bcD23fdBC81D73371c5F41AB4"}', 'https://matic-mumbai.chainstacklabs.com/', 'https://polygonscan.com/');
```

3. Setup Key Management Service (KMS)

a. Create a Customer managed keys on  AWS KMS

b. Add current EC2 instance role to Key users on Customer managed keys

c. Insert KMS information record. Example:
```bash
INSERT INTO kms_cmk (id,region,alias,arn,is_enabled)
	VALUES ('fd131b3a-3460-4dfb-aa11-880edae38cfb','us-east-1','test-kms','arn:aws:kms:us-east-1:941141242545:key/fd131b3a-3460-4dfb-aa11-880edae38cfb',1);
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev
```

## License

This project is under [MIT licensed](LICENSE).

## Gen SSL
You need to generate sslcert with your domain and replace sslcert folder.



