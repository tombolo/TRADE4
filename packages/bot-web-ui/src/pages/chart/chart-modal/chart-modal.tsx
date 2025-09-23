import React, { Suspense } from 'react';
import ProgressLoader from '../../../components/progress-loader/ProgressLoader';
import { observer, useStore } from '@deriv/stores';
import ChartModalDesktop from './chart-modal-desktop';

export const ChartModal = observer(() => {
    const {
        ui: { is_desktop },
    } = useStore();
    return <Suspense fallback={<ProgressLoader fullscreen label='Loading chart…' />}>{is_desktop && <ChartModalDesktop />}</Suspense>;
});

export default ChartModal;
