import express from 'express';
import config from '../config.json';
import cors from 'cors';
import OAuthClient from 'disco-oauth';
import bodyParser from 'body-parser';
import { Stripe } from 'stripe';
import { join } from 'path';

import { router as apiRoutes } from './routes/api-routes';
import Log from '../utils/log';

export const app = express(),
             AuthClient = new OAuthClient(config.bot.id, config.bot.secret),
             stripe = new Stripe(config.api.stripe.apiKey, { apiVersion: '2020-03-02' });

export default class API {
    constructor() {
        AuthClient.setRedirect(`${config.dashboard.url}/auth`);
        AuthClient.setScopes('identify', 'guilds');

        const isLiveKey = config.api.stripe.apiKey.includes('live');
        if (isLiveKey)
            stripe.webhookEndpoints.create({
                url: config.api.url + '/stripe-webhook',
                enabled_events: ['*']
            });

        app.use(cors());
        app.use(bodyParser.json());
        app.use('/api', apiRoutes);
        
        app.use(express.static(join(__dirname, '..', config.dashboard.distPath)));
        
        app.all('*', (req, res) => res.status(200).sendFile(
            join(__dirname, '..', config.dashboard.distPath, '/index.html')));
    }
}

const port = config.api.port || 3000;
app.listen(port, () => Log.info(`API is live on port ${port}`));
