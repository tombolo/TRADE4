import React from 'react';
import LOGO from '../../../Logo/ANALYTICS.png';

const DerivShortLogo = () => {
    return (
        <div className='header__menu-left-logo'>
                <img
                    src={LOGO}
                    alt='Deriv Short Logo'
                    style={{ height: '20px', width: 'auto' }}
                />
        </div>
    );
};

export default DerivShortLogo;