<p align="center">
  <img alt="RadiantPM" src="../../doc-assets/logo-text-dark.svg" height="70px" />
</p>

<p align="center">
  Extremely extensible plugin-based package registry
</p>

---

## S3 Storage Provider

This plugin provides package storage using an S3 provider.

It supports Amazon S3, DigitalOcean Spaces, Dreamhost, Backblaze B2, and any other object storage provider that has an S3 API. You will need to look at their documentation to see the values you need to set.

> **Warning**
>
> This plugin has currently only been tested using DigitalOcean Spaces. Unfortunately I don't have access to any other storage providers so I can't test using them. However, if you do and you find that there's an issue or that the plugin works for a provider, please let me know.

### Configuration

- `s3Endpoint` (required): The S3 provider's API url. Please consult their documentation to find this value.
- `s3Region` (optional): The region that the storage bucket is in. Please consult your provider's documentation to find this value.
- `s3Credentials` (optional): Insert the credentials directly into the config file (**not recommended**, use only for testing). This is an object containing an `accessKeyId` and a `secretAccessKey`.

- `bucketName` (required): The identifier for the bucket that the packages will be saved to.
- `bucketBasePath` (optional): The path that any stored objects will be put into, in the bucket. Mostly useful if you are using one bucket for many things.
- `baseUrl` (optional): The base path for the plugin's API. Defaults to `/-/storage`.

### Where are the files saved

The files are saved to the `pkg` directory in the bucket, either under the base path specified in the configuration, or in the root of the bucket by default. Each package version file is saved with its name as the hash of the package file. Any other attributes of the file are left as default.

### S3 Credentials

If you don't specify credentials in the configuration file, the S3 SDK will search for them at various places on the system running RadiantPM:

1. If RadiantPM is running on an EC2 instance, the credentials are automatically loaded from AWS Identity and Access Management (IAM) roles.
2. If a shared credentials file exists (at `~/.aws/credentials`) it will be used.
3. If [these environment variables](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html) are set, they will be used.

See more information in [AWS's documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html).
