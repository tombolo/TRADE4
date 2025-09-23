import React, { Suspense } from 'react';
import ProgressLoader from '../progress-loader/ProgressLoader';
import { observer, useStore } from '@deriv/stores';
import TransactionDetailsDesktop from './transaction-details-desktop';
import TransactionDetailsMobile from './transaction-details-mobile';

export const TransactionDetails = observer(() => {
    const {
        ui: { is_desktop },
    } = useStore();
    return (
        <Suspense fallback={<ProgressLoader fullscreen label='Loading details…' />}>
            {is_desktop ? <TransactionDetailsDesktop /> : <TransactionDetailsMobile />}
        </Suspense>
    );
});

export default TransactionDetails;
