import * as cdk from '@aws-cdk/core';
import { Construct, Stack, StackProps } from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3Deploy from '@aws-cdk/aws-s3-deployment';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam'


export class CloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    const bucket = new s3.Bucket(this, 'CDKCloudFrontS3', {
      bucketName: 'cdk-cloudfront-s3'
    });

    new s3Deploy.BucketDeployment(this, 'S3Deploy', {
      sources: [s3Deploy.Source.asset('./client')],
      destinationBucket: bucket
    });

    const identity = new cloudfront.OriginAccessIdentity(this, 'id');

    bucket.addToResourcePolicy(new iam.PolicyStatement( {
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(identity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }))

    const distribution = new cloudfront.CloudFrontWebDistribution(this, 'cloudfront', {
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: identity
          },
          behaviors: [
            {
              viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
              allowedMethods: cloudfront.CloudFrontAllowedMethods.GET_HEAD,
              compress: true,
              isDefaultBehavior: true,
            }
          ]
        },
      ],
      defaultRootObject: 'index.html',
      errorConfigurations: [{
        errorCode: 403,
        responseCode: 200,
        responsePagePath: '/index.html',
      }]
    })
  }
}
