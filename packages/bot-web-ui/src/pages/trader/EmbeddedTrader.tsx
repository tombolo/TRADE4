import React from 'react';
import { makeLazyLoader, moduleLoader } from '@deriv/shared';
import { useStore } from '@deriv/stores';
import { useDBotStore } from 'Stores/useDBotStore';
import ProgressLoader from '../../components/progress-loader/ProgressLoader';

const TraderApp = makeLazyLoader(
    () => moduleLoader(() => import(/* webpackChunkName: "embedded-trader-app" */ '@deriv/trader/src')),
    () => <ProgressLoader fullscreen label='Loading Trader…' />
)();

const EmbeddedTrader: React.FC = () => {
    const core_store = useStore();
    const { ws } = useDBotStore();
    return <TraderApp passthrough={{ root_store: core_store, WS: ws }} />;
};

export default EmbeddedTrader;


