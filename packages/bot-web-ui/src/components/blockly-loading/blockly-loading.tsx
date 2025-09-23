import React from 'react';
import { observer } from '@deriv/stores';
import { useDBotStore } from '../../stores/useDBotStore';
import ProgressLoader from '../progress-loader/ProgressLoader';

const BlocklyLoading = observer(() => {
    const { blockly_store } = useDBotStore();
    const { is_loading } = blockly_store;
    return (
        <>
            {is_loading && (
                <div className='bot__loading' data-testid='blockly-loader'>
                    <ProgressLoader label='Loading workspace…' />
                </div>
            )}
        </>
    );
});

export default BlocklyLoading;
