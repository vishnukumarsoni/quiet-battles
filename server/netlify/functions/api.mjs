import { withLambda } from '@netlify/aws-lambda-compat';
import serverless from 'serverless-http';
import { assertRequiredEnv } from '../../config/env.js';
import { connectDb } from '../../config/db.js';
import { createApp } from '../../app.js';

assertRequiredEnv();

const handler = serverless(createApp());

export default withLambda(async (event, context) => {
  await connectDb({ sync: false });
  return handler(event, context);
});

export const config = {
  path: ['/api/*', '/sitemap.xml'],
};