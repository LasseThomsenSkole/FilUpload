# To start the webapp
### Start SeaweedFS S3 server
```
docker run -p 8333:8333 -v "C:\Users\lasse\seaweedfs\data:/data" -v "C:\Users\lasse\seaweedfs\s3.config.json:/etc/seaweedfs/s3.json" chrislusf/seaweedfs server -dir=/data -s3 -s3.config=/etc/seaweedfs/s3.json
```
### create bucket
```
curl --location --request PUT 'http://localhost:8333/filupload'
```
### Set environment variables
Rename the example environment file and set the environment variables
### Install dependencies
```
pnpm install
```
### start the webapp for development
```
pnpm dev
```
