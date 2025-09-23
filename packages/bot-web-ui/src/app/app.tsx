import React from 'react';
import ProgressLoader from '../components/progress-loader/ProgressLoader';
import { makeLazyLoader, moduleLoader } from '@deriv/shared';

const Bot = makeLazyLoader(
    () => moduleLoader(() => import(/* webpackChunkName: "bot-web-ui-app", webpackPreload: true */ './app-main')),
    () => <ProgressLoader fullscreen label='Loading DBot…' />
)();

export default Bot;
