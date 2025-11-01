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

    const staticBots = getStaticBots();
    const strategy = staticBots.find(bot => bot.id === strategy_id);

    if (!strategy) {
        console.error(
            `[ERROR] Bot with id "${strategy_id}" not found. Available bots:`,
            staticBots.map(b => b.id)
        );
        return false;
    }

    try {
        // Get Blockly instance
        const Blockly = getBlockly();
        
        // Check if workspace is initialized
        if (!Blockly.derivWorkspace) {
            console.error('[ERROR] Blockly workspace not initialized');
            return false;
        }

        // Completely reset the workspace first
        console.log(`[DEBUG] Resetting workspace before loading bot: ${strategy_id}`);
        resetWorkspace(Blockly);

        // Get the XML content
        let xmlContent;
        if (typeof strategy.xml === 'string') {
            xmlContent = strategy.xml;
        } else if (strategy.xml && typeof strategy.xml.default === 'string') {
            xmlContent = strategy.xml.default;
        } else {
            console.error('[ERROR] Invalid XML content format for bot:', strategy_id);
            return false;
        }

        // Parse the XML content
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
        
        // Check for XML parsing errors
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            console.error('[ERROR] XML parsing error:', parserError.textContent);
            return false;
        }

        const xmlDom = xmlDoc.documentElement;
        const convertedXml = convertStrategyToIsDbot(xmlDom);

        // Disable events during load to prevent interference
        Blockly.Events.disable();
        
        try {
            // Clear any existing blocks (triple-check)
            Blockly.derivWorkspace.clear();
            
            // Ensure the workspace is clean
            Blockly.derivWorkspace.clearUndo();
            
            // Create a new XML document to ensure clean state
            const xmlText = Blockly.Xml.domToText(convertedXml);
            const newXml = Blockly.Xml.textToDom(xmlText);
            
            // Load the new blocks
            Blockly.Xml.domToWorkspace(newXml, Blockly.derivWorkspace);
            
            // Store the current strategy ID
            Blockly.derivWorkspace.current_strategy_id = strategy_id;
            
            // Force a re-render after a short delay
            setTimeout(() => {
                try {
                    if (Blockly.derivWorkspace.svgResize) {
                        Blockly.derivWorkspace.svgResize();
                    }
                    Blockly.derivWorkspace.render();
                    
                    // Force variable cleanup
                    if (Blockly.derivWorkspace.getVariableMap) {
                        const variableMap = Blockly.derivWorkspace.getVariableMap();
                        if (variableMap && variableMap.clear) {
                            variableMap.clear();
                        }
                    }
                    
                    console.log(`[SUCCESS] Loaded static bot: ${strategy.name} (ID: ${strategy_id})`);
                } catch (renderError) {
                    console.error('Error during workspace render:', renderError);
                }
            }, 150);
            
            return true;
        } catch (loadError) {
            console.error('Error loading bot:', loadError);
            return false;
        } finally {
            // Always re-enable events
            Blockly.Events.enable();
        }
    } catch (error) {
        console.error('Error in loadStrategy:', error);
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

// 🧪 Test function to verify all bots can be parsed
export const testAllBots = () => {
    const staticBots = getStaticBots();
    console.log('[TEST] Testing all bot XML files...');
    
    staticBots.forEach(bot => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(bot.xml, 'text/xml');
            const hasErrors = doc.getElementsByTagName('parsererror').length > 0;
            
            if (hasErrors) {
                console.error(`[TEST FAIL] ${bot.id}: XML parsing error`);
                console.error(`[TEST FAIL] XML preview:`, bot.xml.substring(0, 300) + '...');
            } else {
                console.log(`[TEST PASS] ${bot.id}: XML is valid (${bot.xml.length} chars)`);
            }
        } catch (e) {
            console.error(`[TEST FAIL] ${bot.id}: Exception during parsing:`, e.message);
        }
    });
};

// Run test on load
setTimeout(testAllBots, 1000);
