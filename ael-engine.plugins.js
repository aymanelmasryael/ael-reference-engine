/**
 * AEL Plugin System v1.1.0
 * Provides Plugin API, Event Bus, Lifecycle Hooks, and Plugin Registry.
 */
(function () {
  "use strict";

  // ── Plugin Registry ──────────────────────────────────────────────────────
  // Stores all registered plugins and their metadata
  
  const registry = new Map();
  const hookQueue = new Map();
  const eventListeners = new Map();

  // ── Event Bus ────────────────────────────────────────────────────────────
  // Allows plugins to communicate with each other
  
  const EventBus = {
    on(event, callback, priority = 10) {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event).push({ callback, priority });
      eventListeners.get(event).sort((a, b) => a.priority - b.priority);
    },

    off(event, callback) {
      if (!eventListeners.has(event)) return;
      const listeners = eventListeners.get(event);
      const idx = listeners.findIndex(l => l.callback === callback);
      if (idx !== -1) listeners.splice(idx, 1);
    },

    emit(event, data) {
      if (!eventListeners.has(event)) return data;
      const listeners = eventListeners.get(event);
      let result = data;
      for (const { callback } of listeners) {
        result = callback(result) ?? result;
      }
      return result;
    },

    once(event, callback) {
      const wrapper = (data) => {
        EventBus.off(event, wrapper);
        return callback(data);
      };
      EventBus.on(event, wrapper);
    }
  };

  // ── Lifecycle Hooks ──────────────────────────────────────────────────────
  // Defines the engine lifecycle events that plugins can hook into
  
  const LIFECYCLE = {
    BEFORE_INIT: 'before:init',
    AFTER_INIT: 'after:init',
    BEFORE_RENDER: 'before:render',
    AFTER_RENDER: 'after:render',
    BEFORE_SEARCH: 'before:search',
    AFTER_SEARCH: 'after:search',
    BEFORE_EXPORT: 'before:export',
    AFTER_EXPORT: 'after:export',
    BEFORE_EXPAND: 'before:expand',
    AFTER_EXPAND: 'after:expand',
    BEFORE_COLLAPSE: 'before:collapse',
    AFTER_COLLAPSE: 'after:collapse',
    ON_FILTER: 'on:filter',
    ON_NAVIGATE: 'on:navigate',
    ON_THEME_CHANGE: 'on:theme:change',
    ON_DATA_LOAD: 'on:data:load',
    ON_ERROR: 'on:error',
    DESTROY: 'destroy'
  };

  // ── Plugin API ───────────────────────────────────────────────────────────
  // The core API that plugins interact with
  
  const PluginAPI = {
    // Register a hook for a lifecycle event
    hook(event, callback, priority = 10) {
      EventBus.on(event, callback, priority);
    },

    // Emit a lifecycle event
    emit(event, data) {
      return EventBus.emit(event, data);
    },

    // Get the registry
    getRegistry() {
      return Array.from(registry.values());
    },

    // Get a specific plugin
    getPlugin(name) {
      return registry.get(name);
    },

    // Access engine internals (controlled)
    engine: {
      getData: () => window.AEL?.getData?.(),
      search: (q) => window.AEL?.search?.(q),
      expandAll: () => window.AEL?.expandAll?.(),
      collapseAll: () => window.AEL?.collapseAll?.(),
      render: () => window.AEL?.render?.(),
    }
  };

  // ── Plugin Installation ──────────────────────────────────────────────────
  
  function use(plugin) {
    if (!plugin || !plugin.name) {
      console.error('AEL Plugin: Plugin must have a name.');
      return false;
    }

    if (registry.has(plugin.name)) {
      console.warn(`AEL Plugin: "${plugin.name}" is already installed.`);
      return false;
    }

    // Validate plugin structure
    if (typeof plugin.install !== 'function') {
      console.error(`AEL Plugin: "${plugin.name}" must have an install() method.`);
      return false;
    }

    // Register the plugin
    registry.set(plugin.name, {
      name: plugin.name,
      version: plugin.version || '1.0.0',
      description: plugin.description || '',
      author: plugin.author || '',
      installedAt: Date.now(),
      enabled: true
    });

    // Run the install method
    try {
      plugin.install(PluginAPI);
      EventBus.emit('plugin:installed', { name: plugin.name });
      return true;
    } catch (err) {
      console.error(`AEL Plugin: Failed to install "${plugin.name}":`, err);
      registry.delete(plugin.name);
      return false;
    }
  }

  function uninstall(pluginName) {
    if (!registry.has(pluginName)) {
      console.warn(`AEL Plugin: "${pluginName}" is not installed.`);
      return false;
    }

    const plugin = registry.get(pluginName);
    
    // Emit uninstall event
    EventBus.emit('plugin:uninstalling', { name: pluginName });

    // Remove all hooks for this plugin
    for (const [event, listeners] of eventListeners) {
      const filtered = listeners.filter(l => l.pluginName !== pluginName);
      eventListeners.set(event, filtered);
    }

    // Remove from registry
    registry.delete(pluginName);
    EventBus.emit('plugin:uninstalled', { name: pluginName });
    return true;
  }

  function enable(pluginName) {
    if (registry.has(pluginName)) {
      registry.get(pluginName).enabled = true;
      EventBus.emit('plugin:enabled', { name: pluginName });
    }
  }

  function disable(pluginName) {
    if (registry.has(pluginName)) {
      registry.get(pluginName).enabled = false;
      EventBus.emit('plugin:disabled', { name: pluginName });
    }
  }

  function list() {
    return Array.from(registry.values()).map(p => ({
      name: p.name,
      version: p.version,
      description: p.description,
      enabled: p.enabled
    }));
  }

  // ── Export to window.AEL ─────────────────────────────────────────────────

  window.AEL = window.AEL || {};
  window.AEL.use = use;
  window.AEL.uninstall = uninstall;
  window.AEL.enable = enable;
  window.AEL.disable = disable;
  window.AEL.plugins = list;
  window.AEL.hooks = PluginAPI.hook;
  window.AEL.events = EventBus;
  window.AEL.LIFECYCLE = LIFECYCLE;
  window.AEL.PluginAPI = PluginAPI;

})();
