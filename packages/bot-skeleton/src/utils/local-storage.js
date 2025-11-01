import LZString from 'lz-string';
import localForage from 'localforage';
import DBotStore from '../scratch/dbot-store';
import { save_types } from '../constants/save-type';

// Import legacy bots
import Auto102ByLegacyHub from './legacy/AUTO102BYLEGACYHUB.xml';
import EvenEvenOddOddBot from './legacy/EVENEVEN_ODDODDBot.xml';
import OddOddEvenEvenBot from './legacy/ODDODDEVENEVENBOT.xml';
import OverDestroyerByLegacy from './legacy/OVERDESTROYERBYLEGACY.xml';
import LegacyQ1 from './legacy/legacyQ1.xml';
import LegacyV1Speedbot from './legacy/legacyv1speedbot.xml';


// Ensure Blockly is available globally
const getBlockly = () => {
    if (typeof window !== 'undefined' && window.Blockly) {
        return window.Blockly;
    }
    throw new Error('Blockly not available - workspace not initialized');
};

// Static bot configurations - Legacy Bots Only
const STATIC_BOTS = {
    auto_102_legacy_hub: {
        id: 'auto_102_legacy_hub',
        name: 'AUTO 102 BY LEGACY HUB',
        xml: Auto102ByLegacyHub,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    },
    even_even_odd_odd: {
        id: 'even_even_odd_odd',
        name: 'EVEN EVEN ODD ODD BOT',
        xml: EvenEvenOddOddBot,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    },
    odd_odd_even_even: {
        id: 'odd_odd_even_even',
        name: 'ODD ODD EVEN EVEN BOT',
        xml: OddOddEvenEvenBot,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    },
    over_destroyer_legacy: {
        id: 'over_destroyer_legacy',
        name: 'OVER DESTROYER BY LEGACY',
        xml: OverDestroyerByLegacy,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    },
    legacy_q1: {
        id: 'legacy_q1',
        name: 'LEGACY Q1 BOT',
        xml: LegacyQ1,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    },
    legacy_v1_speedbot: {
        id: 'legacy_v1_speedbot',
        name: 'LEGACY V1 SPEEDBOT',
        xml: LegacyV1Speedbot,
        timestamp: Date.now(),
        save_type: save_types.LOCAL,
    }
};

const getStaticBots = () => Object.values(STATIC_BOTS);

/**
 * 🔒 Disable saving bots
 */
export const saveWorkspaceToRecent = async () => {
    console.warn('[INFO] Saving disabled → Using static bots only.');
    const {
        load_modal: { updateListStrategies },
    } = DBotStore.instance;
    updateListStrategies(getStaticBots());
};

/**
 * ✅ Always return static bots
 */
export const getSavedWorkspaces = async () => {
    const bots = getStaticBots();
    console.log(
        '[DEBUG] Available static bots:',
        bots.map(bot => bot.id)
    );
    return bots;
};

/**
 * Load a bot by ID (from static list only)
 */
export const loadStrategy = async strategy_id => {
    console.log(`[DEBUG] Attempting to load bot: ${strategy_id}`);

    // Check for duplicate IDs
    const staticBots = getStaticBots();
    const duplicateIds = staticBots.filter((bot, index) => staticBots.findIndex(b => b.id === bot.id) !== index);

    if (duplicateIds.length > 0) {
        console.error(
            '[ERROR] Duplicate bot IDs found:',
            duplicateIds.map(b => b.id)
        );
    }

    const strategy = staticBots.find(bot => bot.id === strategy_id);

    if (!strategy) {
        console.error(
            `[ERROR] Bot with id "${strategy_id}" not found. Available bots:`,
            staticBots.map(b => b.id)
        );
        return false;
    }

    try {
        // Check if workspace is initialized
        if (!Blockly.derivWorkspace) {
            console.error('[ERROR] Blockly workspace not initialized');
            return false;
        }

        // Clear existing workspace first
        console.log('[DEBUG] Clearing existing workspace');
        Blockly.derivWorkspace.clear();

        const parser = new DOMParser();
        const xmlDom = parser.parseFromString(strategy.xml, 'text/xml').documentElement;

        // Check if XML is valid
        if (xmlDom.querySelector('parsererror')) {
            console.error('[ERROR] Invalid XML content for bot:', strategy_id);
            return false;
        }

        const convertedXml = convertStrategyToIsDbot(xmlDom);

        Blockly.Xml.domToWorkspace(convertedXml, Blockly.derivWorkspace);
        Blockly.derivWorkspace.current_strategy_id = strategy_id;

        console.log(`[SUCCESS] Loaded static bot: ${strategy.name} (ID: ${strategy_id})`);
        return true;
    } catch (error) {
        console.error('Error loading static bot:', error);
        return false;
    }
};

/**
 * 🔒 Disable removing bots
 */
export const removeExistingWorkspace = async () => {
    console.warn('[INFO] Remove disabled → Static bots only.');
    return false;
};

/**
 * Ensure xml has `is_dbot` flag
 */
export const convertStrategyToIsDbot = xml_dom => {
    if (!xml_dom) return;
    xml_dom.setAttribute('is_dbot', 'true');
    return xml_dom;
};

// 🧹 Clear storage & recents at startup
localStorage.removeItem('saved_workspaces');
localStorage.removeItem('recent_strategies');
console.log('[INFO] Cleared saved/recent bots → Static bots only.');