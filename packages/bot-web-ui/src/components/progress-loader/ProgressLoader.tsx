import React from 'react';
import classNames from 'classnames';
import './progress-loader.scss';

type ProgressLoaderProps = {
    className?: string;
    fullscreen?: boolean;
    label?: string;
};

const ProgressLoader: React.FC<ProgressLoaderProps> = ({ className, fullscreen = false, label }) => {
    return (
        <div className={classNames('progress-loader', { 'progress-loader--fullscreen': fullscreen }, className)} data-testid='progress-loader'>
            <div className='progress-loader__container'>
                <div className='progress-loader__glow' />
                <div className='progress-loader__track'>
                    <div className='progress-loader__bar'>
                        <span className='progress-loader__shine' />
                        <span className='progress-loader__particles'>
                            <i /><i /><i />
                        </span>
                    </div>
                </div>
                {label && <div className='progress-loader__label'>{label}</div>}
            </div>
        </div>
    );
};

export default ProgressLoader;


