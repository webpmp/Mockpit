import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentInstance } from '../../types';
import {
  HMI_RULES,
  HMIRule,
  RuleTier,
  RuleStatus,
  RuleCategory,
  AuditContext,
  RuleFinding,
  DEFAULT_DISPLAY_CONFIG,
  DisplayConfig,
} from '../../lib/hmiRules/registry';
import {
  runAudit,
  buildNavTree,
  generateAuditReportJson,
  generateAuditReportHtml,
} from '../../lib/hmiRules/auditEngine';
import { recordRuntimeInteraction, getRuntimeLog, clearRuntimeLog } from '../../lib/hmiRules/runtimeInstrumenter';
import { getComponentDisplayName } from '../../utils/componentDisplayNames';
import { RuleInfoAffordance } from './RuleInfoAffordance';
import { RuleRegistryBrowser } from './RuleRegistryBrowser';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Eye,
  Sliders,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  FileText,
  MousePointer,
  Sparkles,
  Search,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Monitor,
  Check,
  LayoutGrid,
  ListFilter,
  BookOpen,
} from 'lucide-react';

interface ComponentAuditGroup {
  instanceId: string;
  componentType: string;
  screenId?: string;
  screenName?: string;
  issues: RuleFinding[];
  fails: RuleFinding[];
  warnings: RuleFinding[];
  passes: RuleFinding[];
  totalIssues: number;
}

export const normalizeCategoryName = (tagOrCategory?: string): string => {
  if (!tagOrCategory) return 'General';
  const lower = tagOrCategory.toLowerCase().trim();
  if (lower.includes('tap target') || lower === 'tap targets') return 'Tap Targets';
  if (lower.includes('feedback') || lower.includes('animation')) return 'Feedback & Animation';
  if (lower.includes('overlay') || lower.includes('modal')) return 'Overlays & Modals';
  if (lower.includes('content') || lower.includes('copy')) return 'Content & Copy';
  if (lower.includes('color') || lower.includes('contrast')) return 'Color & Contrast';
  if (lower.includes('timing') || lower.includes('glance')) return 'Timing & Glance Load';
  if (lower.includes('navigation') || lower.includes('layout')) return 'Navigation and Layout';
  if (lower.includes('icon') || lower.includes('symbol')) return 'Icon & Symbols';
  if (lower.includes('input') || lower.includes('driving')) return 'Input & Driving Mode';
  if (lower.includes('text') || lower.includes('legibility')) return 'Text Legibility';
  return tagOrCategory
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
};

export const AuditPanel: React.FC = () => {
  const setScreenMode = useMockpitStore((s) => s.setScreenMode);
  const activeView = useMockpitStore((s) => s.activeView);
  const setActiveView = useMockpitStore((s) => s.setActiveView);
  const screens = useMockpitStore((s) => s.screens);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);
  const activeTrip = useMockpitStore((s) => s.activeTrip);
  const hmiAuditNotes = useMockpitStore((s) => s.hmiAuditNotes);
  const setAuditNote = useMockpitStore((s) => s.setAuditNote);
  const toggleAuditReviewStatus = useMockpitStore((s) => s.toggleAuditReviewStatus);
  const displayConfig = useMockpitStore((s) => s.displayConfig) || DEFAULT_DISPLAY_CONFIG;
  const updateDisplayConfig = useMockpitStore((s) => s.updateDisplayConfig);
  const auditTargetScreenId = useMockpitStore((s) => s.auditTargetScreenId);
  const setAuditTargetScreenId = useMockpitStore((s) => s.setAuditTargetScreenId);
  const userDefinedManualRules = useMockpitStore((s) => s.userDefinedManualRules);
  const editedBaseManualRules = useMockpitStore((s) => s.editedBaseManualRules);
  const backgroundColor = useMockpitStore((s) => s.backgroundColor);

  // Tab mode: 'findings' vs 'registry'
  const [activeAuditTab, setActiveAuditTab] = useState<'findings' | 'registry'>('findings');

  // Compute effective live rules with user additions and manual rule edits
  const effectiveRules: HMIRule[] = useMemo(() => {
    const baseWithOverrides = HMI_RULES.map((rule) => {
      if (rule.tier === 'manual' && editedBaseManualRules[rule.id]) {
        return { ...rule, ...editedBaseManualRules[rule.id] };
      }
      return rule;
    });
    return [...baseWithOverrides, ...userDefinedManualRules];
  }, [editedBaseManualRules, userDefinedManualRules]);

  // Grouping mode: rule-first (default) vs component-first
  const [groupBy, setGroupBy] = useState<'rule' | 'component'>('rule');
  const [activeTierTab, setActiveTierTab] = useState<'static' | 'runtime' | 'manual'>('static');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | RuleTier>('all');
  // v1.1: Default to 'issues' filter
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'issues' | 'pass'>('issues');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [runtimeEntries, setRuntimeEntries] = useState(getRuntimeLog());
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  // State for expanded passing component lists
  const [expandedPassIds, setExpandedPassIds] = useState<Record<string, boolean>>({});
  // State for expanded rule cards (collapsed by default in v2)
  const [expandedRuleCards, setExpandedRuleCards] = useState<Record<string, boolean>>({});

  // Popover state for merged Filters control (v7)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersPopoverRef = useRef<HTMLDivElement>(null);

  // Close filters popover on click outside or Escape
  useEffect(() => {
    if (!isFiltersOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filtersPopoverRef.current && !filtersPopoverRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFiltersOpen]);

  // Active filters count and summary parts for v7 merged Filters control
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedStatusFilter !== 'all') count += 1;
    if (selectedCategoryFilter !== 'all') count += 1;
    return count;
  }, [selectedStatusFilter, selectedCategoryFilter]);

  const activeFilterSummaryParts = useMemo(() => {
    const parts: string[] = [];
    if (selectedStatusFilter === 'issues') {
      parts.push('Issues');
    } else if (selectedStatusFilter === 'pass') {
      parts.push('Passed');
    }
    if (selectedCategoryFilter !== 'all') {
      parts.push(selectedCategoryFilter);
    }
    return parts;
  }, [selectedStatusFilter, selectedCategoryFilter]);

  // Sync activeTierTab when selectedTierFilter is changed externally
  useEffect(() => {
    if (selectedTierFilter === 'static' || selectedTierFilter === 'runtime' || selectedTierFilter === 'manual') {
      setActiveTierTab(selectedTierFilter);
    }
  }, [selectedTierFilter]);

  // Sync runtime log updates
  useEffect(() => {
    const handleLogUpdate = () => {
      setRuntimeEntries(getRuntimeLog());
    };
    window.addEventListener('mockpit-runtime-log-updated', handleLogUpdate);
    window.addEventListener('mockpit-runtime-log-cleared', handleLogUpdate);
    return () => {
      window.removeEventListener('mockpit-runtime-log-updated', handleLogUpdate);
      window.removeEventListener('mockpit-runtime-log-cleared', handleLogUpdate);
    };
  }, []);

  // Determine current screen definitions and components based on target selection
  const targetScreenDef = screens.find((s) => s.id === auditTargetScreenId) || screens.find((s) => s.id === activeView) || screens[0];
  const effectiveScreenId = auditTargetScreenId === 'all' ? 'all' : (targetScreenDef?.id || activeView);
  const screenName = auditTargetScreenId === 'all' ? 'All Screens (Project-Wide)' : (targetScreenDef?.name || effectiveScreenId);

  // Build audit context
  const auditContext: AuditContext = useMemo(() => {
    const navTree = buildNavTree(screens);
    const instances = auditTargetScreenId === 'all'
      ? Object.values(componentsByScreen).flat()
      : (componentsByScreen[effectiveScreenId] || []);

    return {
      screenId: effectiveScreenId,
      allScreens: auditTargetScreenId === 'all',
      instances,
      componentsByScreen,
      screens,
      navTree,
      runtimeLog: runtimeEntries,
      displayConfig,
      canvasScale: 1.0,
      activeTrip,
      screenBackgroundColor: backgroundColor || '#020617',
    };
  }, [effectiveScreenId, auditTargetScreenId, componentsByScreen, screens, runtimeEntries, displayConfig, activeTrip, backgroundColor]);

  // Run audit engine
  const findings = useMemo(() => {
    return runAudit(auditContext, effectiveRules);
  }, [auditContext, effectiveRules]);

  // Summary counts per tier
  const summaries = useMemo(() => {
    const staticFindings = findings.filter((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      return rule?.tier === 'static';
    });
    const runtimeFindings = findings.filter((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      return rule?.tier === 'runtime';
    });
    const manualFindings = findings.filter((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      return rule?.tier === 'manual';
    });

    const screenNotes = hmiAuditNotes[effectiveScreenId] || {};

    return {
      static: {
        pass: staticFindings.filter((f) => f.status === 'pass').length,
        fail: staticFindings.filter((f) => f.status === 'fail').length,
        warning: staticFindings.filter((f) => f.status === 'warning').length,
      },
      runtime: {
        pass: runtimeFindings.filter((f) => f.status === 'pass').length,
        fail: runtimeFindings.filter((f) => f.status === 'fail').length,
        notMeasured: runtimeFindings.filter((f) => f.status === 'not-measured').length,
      },
      manual: {
        reviewed: manualFindings.filter((f) => screenNotes[f.ruleId]?.status === 'reviewed').length,
        needsReview: manualFindings.filter((f) => screenNotes[f.ruleId]?.status !== 'reviewed').length,
      },
    };
  }, [findings, hmiAuditNotes, effectiveScreenId]);

  // Group findings by Component (Default v1.2 grouping)
  const groupedComponentsData = useMemo(() => {
    const compMap = new Map<string, ComponentAuditGroup>();
    const screenLevelFails: RuleFinding[] = [];
    const screenLevelWarnings: RuleFinding[] = [];
    const screenLevelPasses: RuleFinding[] = [];

    const screensToProcess: [string, ComponentInstance[]][] = auditTargetScreenId === 'all'
      ? Object.entries(componentsByScreen)
      : [[effectiveScreenId, componentsByScreen[effectiveScreenId] || []]];

    // Pre-populate with all known screen instances
    screensToProcess.forEach(([sId, instList]) => {
      (instList || []).forEach((inst) => {
        compMap.set(inst.id, {
          instanceId: inst.id,
          componentType: inst.type,
          screenId: sId,
          screenName: screens.find((s) => s.id === sId)?.name,
          issues: [],
          fails: [],
          warnings: [],
          passes: [],
          totalIssues: 0,
        });
      });
    });

    findings.forEach((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      if (!rule || rule.tier === 'manual') return; // Handled in manual review section

      if (f.instanceId) {
        let group = compMap.get(f.instanceId);
        if (!group) {
          group = {
            instanceId: f.instanceId,
            componentType: f.instanceId,
            screenId: f.screenId,
            screenName: screens.find((s) => s.id === f.screenId)?.name,
            issues: [],
            fails: [],
            warnings: [],
            passes: [],
            totalIssues: 0,
          };
          compMap.set(f.instanceId, group);
        }

        if (f.status === 'fail') {
          group.fails.push(f);
          group.issues.push(f);
        } else if (f.status === 'warning') {
          group.warnings.push(f);
          group.issues.push(f);
        } else if (f.status === 'pass') {
          group.passes.push(f);
        }
        group.totalIssues = group.fails.length + group.warnings.length;
      } else {
        // Screen-level findings (IA menu depth, global overlays, etc.)
        if (f.status === 'fail') screenLevelFails.push(f);
        else if (f.status === 'warning') screenLevelWarnings.push(f);
        else if (f.status === 'pass') screenLevelPasses.push(f);
      }
    });

    const componentList = Array.from(compMap.values());

    // Sort components: worst first (highest issue count descending, then fails count descending)
    componentList.sort((a, b) => {
      if (b.totalIssues !== a.totalIssues) {
        return b.totalIssues - a.totalIssues;
      }
      if (b.fails.length !== a.fails.length) {
        return b.fails.length - a.fails.length;
      }
      return getComponentDisplayName(a.componentType).localeCompare(getComponentDisplayName(b.componentType));
    });

    const screenLevelGroup = {
      fails: screenLevelFails,
      warnings: screenLevelWarnings,
      passes: screenLevelPasses,
      issues: [...screenLevelFails, ...screenLevelWarnings],
      totalIssues: screenLevelFails.length + screenLevelWarnings.length,
    };

    return {
      componentList,
      screenLevelGroup,
    };
  }, [findings, auditTargetScreenId, componentsByScreen, effectiveScreenId, screens]);

  interface RuleAuditGroup {
    ruleId: string;
    rule: HMIRule;
    fails: RuleFinding[];
    warnings: RuleFinding[];
    passes: RuleFinding[];
    notMeasured: RuleFinding[];
    affectedInstances: {
      instanceId: string;
      componentType: string;
      screenId?: string;
      status: 'fail' | 'warning';
      measured?: string | number;
      threshold?: string;
      message?: string;
    }[];
  }

  // Group findings by rule for Automated & Manual categories (Section 4a)
  const groupedRulesData = useMemo(() => {
    const ruleMap = new Map<string, RuleAuditGroup>();

    findings.forEach((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId) || HMI_RULES.find((r) => r.id === f.ruleId);
      if (!rule || rule.tier === 'manual') return;
      if (selectedTierFilter !== 'all' && rule.tier !== selectedTierFilter) return;

      let group = ruleMap.get(f.ruleId);
      if (!group) {
        group = { ruleId: f.ruleId, rule, fails: [], warnings: [], passes: [], notMeasured: [], affectedInstances: [] };
        ruleMap.set(f.ruleId, group);
      }

      if (f.status === 'fail') {
        group.fails.push(f);
      } else if (f.status === 'warning') {
        group.warnings.push(f);
      } else if (f.status === 'not-measured') {
        group.notMeasured.push(f);
      } else if (f.status === 'pass') {
        group.passes.push(f);
        return; // passes don't populate affectedInstances
      }

      if (f.instanceId) {
        const allInstances = Object.values(componentsByScreen).flat();
        const comp = allInstances.find((i) => i.id === f.instanceId);
        const componentType = comp?.type || f.instanceId;

        let screenId = f.screenId;
        if (!screenId || screenId === 'all') {
          for (const [sId, sComps] of Object.entries(componentsByScreen)) {
            if (sComps.some((c) => c.id === f.instanceId)) {
              screenId = sId;
              break;
            }
          }
        }

        group.affectedInstances.push({
          instanceId: f.instanceId,
          componentType,
          screenId,
          status: f.status as 'fail' | 'warning',
          measured: f.measured,
          threshold: f.threshold,
          message: f.message,
        });
      }
    });

    let list = Array.from(ruleMap.values());

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (g) =>
          (g.rule.plainHeadline && g.rule.plainHeadline.toLowerCase().includes(q)) ||
          (g.rule.categoryTag && g.rule.categoryTag.toLowerCase().includes(q)) ||
          g.rule.title.toLowerCase().includes(q) ||
          g.rule.id.toLowerCase().includes(q) ||
          g.rule.description.toLowerCase().includes(q) ||
          (g.rule.standardRef && g.rule.standardRef.toLowerCase().includes(q))
      );
    }

    if (selectedStatusFilter === 'issues') {
      list = list.filter((g) => g.fails.length + g.warnings.length > 0);
    } else if (selectedStatusFilter === 'pass') {
      list = list.filter((g) => g.fails.length + g.warnings.length === 0 && g.passes.length > 0);
    }

    // Sort rules strictly by severity:
    // 1. Fails first (by fail count desc, then warn count desc)
    // 2. Warnings second (by warn count desc)
    // 3. Not measured third
    // 4. Passes last (alphabetically by plain headline / title)
    list.sort((a, b) => {
      const aHasFails = a.fails.length > 0;
      const bHasFails = b.fails.length > 0;
      if (aHasFails && !bHasFails) return -1;
      if (!aHasFails && bHasFails) return 1;
      if (aHasFails && bHasFails) {
        if (b.fails.length !== a.fails.length) return b.fails.length - a.fails.length;
        return b.warnings.length - a.warnings.length;
      }

      const aHasWarn = a.warnings.length > 0;
      const bHasWarn = b.warnings.length > 0;
      if (aHasWarn && !bHasWarn) return -1;
      if (!aHasWarn && bHasWarn) return 1;
      if (aHasWarn && bHasWarn) {
        return b.warnings.length - a.warnings.length;
      }

      const aHasUnmeasured = a.notMeasured.length > 0;
      const bHasUnmeasured = b.notMeasured.length > 0;
      if (aHasUnmeasured && !bHasUnmeasured) return -1;
      if (!aHasUnmeasured && bHasUnmeasured) return 1;

      const aTitle = a.rule.plainHeadline || a.rule.title;
      const bTitle = b.rule.plainHeadline || b.rule.title;
      return aTitle.localeCompare(bTitle);
    });
    return list;
  }, [findings, effectiveRules, selectedTierFilter, selectedStatusFilter, searchQuery, componentsByScreen]);

  // Current tab rules (filters by active tier tab when selectedTierFilter is 'all')
  const currentTabRules = useMemo(() => {
    if (selectedTierFilter !== 'all') {
      return groupedRulesData;
    }
    return groupedRulesData.filter((g) => g.rule.tier === activeTierTab);
  }, [groupedRulesData, selectedTierFilter, activeTierTab]);

  // Available categories for the current tab (Item 7)
  const availableCategoriesForCurrentTab = useMemo(() => {
    const cats = new Set<string>();
    effectiveRules
      .filter((r) => r.tier === activeTierTab)
      .forEach((r) => {
        cats.add(normalizeCategoryName(r.categoryTag || r.category));
      });
    return Array.from(cats).sort();
  }, [activeTierTab, effectiveRules]);

  // Category-grouped rules for the current tab with two-level sorting (Item 6 & 7)
  const categoryGroupedRules = useMemo(() => {
    let rules = currentTabRules;
    if (selectedCategoryFilter !== 'all') {
      rules = rules.filter(
        (g) => normalizeCategoryName(g.rule.categoryTag || g.rule.category) === selectedCategoryFilter
      );
    }

    const catMap = new Map<string, typeof currentTabRules>();
    rules.forEach((ruleGroup) => {
      const catName = normalizeCategoryName(ruleGroup.rule.categoryTag || ruleGroup.rule.category);
      const list = catMap.get(catName) || [];
      list.push(ruleGroup);
      catMap.set(catName, list);
    });

    const categories = Array.from(catMap.entries()).map(([categoryName, catRules]) => {
      let maxFails = 0;
      let totalFails = 0;
      let maxWarnings = 0;
      let totalWarnings = 0;
      let hasUnmeasured = false;

      catRules.forEach((rg) => {
        const failCount = rg.fails.length;
        const warnCount = rg.warnings.length;
        if (failCount > maxFails) maxFails = failCount;
        totalFails += failCount;
        if (warnCount > maxWarnings) maxWarnings = warnCount;
        totalWarnings += warnCount;
        if (rg.notMeasured.length > 0) hasUnmeasured = true;
      });

      return {
        categoryName,
        rules: catRules,
        maxFails,
        totalFails,
        maxWarnings,
        totalWarnings,
        hasUnmeasured,
      };
    });

    // Two-level sort: category order by severity (Item 6)
    categories.sort((a, b) => {
      const aHasFails = a.maxFails > 0;
      const bHasFails = b.maxFails > 0;
      if (aHasFails && !bHasFails) return -1;
      if (!aHasFails && bHasFails) return 1;
      if (aHasFails && bHasFails) {
        if (b.maxFails !== a.maxFails) return b.maxFails - a.maxFails;
        if (b.totalFails !== a.totalFails) return b.totalFails - a.totalFails;
        return b.maxWarnings - a.maxWarnings;
      }

      const aHasWarn = a.maxWarnings > 0;
      const bHasWarn = b.maxWarnings > 0;
      if (aHasWarn && !bHasWarn) return -1;
      if (!aHasWarn && bHasWarn) return 1;
      if (aHasWarn && bHasWarn) {
        if (b.maxWarnings !== a.maxWarnings) return b.maxWarnings - a.maxWarnings;
        return b.totalWarnings - a.totalWarnings;
      }

      if (a.hasUnmeasured && !b.hasUnmeasured) return -1;
      if (!a.hasUnmeasured && b.hasUnmeasured) return 1;

      return a.categoryName.localeCompare(b.categoryName);
    });

    return categories;
  }, [currentTabRules, selectedCategoryFilter]);

  // Unmeasured runtime rules
  const unmeasuredRuntimeRules = useMemo(() => {
    const findingsByRule = new Map<string, RuleFinding[]>();
    findings.forEach((f) => {
      const list = findingsByRule.get(f.ruleId) || [];
      list.push(f);
      findingsByRule.set(f.ruleId, list);
    });

    return effectiveRules.filter((rule) => {
      if (rule.tier !== 'runtime') return false;
      const rf = findingsByRule.get(rule.id) || [];
      const notMeasured = rf.filter((f) => f.status === 'not-measured');
      const fails = rf.filter((f) => f.status === 'fail');
      const warnings = rf.filter((f) => f.status === 'warning');
      const passes = rf.filter((f) => f.status === 'pass');
      return notMeasured.length > 0 && fails.length === 0 && warnings.length === 0 && passes.length === 0;
    });
  }, [findings, effectiveRules]);

  // Manual rules data
  const manualList = useMemo(() => {
    const findingsByRule = new Map<string, RuleFinding[]>();
    findings.forEach((f) => {
      const list = findingsByRule.get(f.ruleId) || [];
      list.push(f);
      findingsByRule.set(f.ruleId, list);
    });

    return effectiveRules
      .filter((rule) => rule.tier === 'manual')
      .map((rule) => {
        const ruleFindings = findingsByRule.get(rule.id) || [];
        const finding = ruleFindings[0] || {
          ruleId: rule.id,
          status: 'needs-review',
          message: rule.description,
          standardRef: rule.standardRef,
        };
        return {
          rule,
          finding,
        };
      });
  }, [findings, effectiveRules]);

  // Filter Manual rules by search & category
  const filteredManualRules = useMemo(() => {
    return manualList.filter(({ rule }) => {
      if (selectedTierFilter !== 'all' && rule.tier !== selectedTierFilter) {
        return false;
      }

      // Category filter (Item 7)
      if (selectedCategoryFilter !== 'all') {
        if (normalizeCategoryName(rule.categoryTag || rule.category) !== selectedCategoryFilter) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${rule.plainHeadline || ''} ${rule.categoryTag || ''} ${rule.title} ${rule.id} ${rule.description} ${rule.category} ${rule.standardRef || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [manualList, selectedTierFilter, selectedCategoryFilter, searchQuery]);

  // Category-grouped manual rules
  const categoryGroupedManualRules = useMemo(() => {
    const catMap = new Map<string, typeof filteredManualRules>();
    filteredManualRules.forEach((item) => {
      const catName = normalizeCategoryName(item.rule.categoryTag || item.rule.category);
      const list = catMap.get(catName) || [];
      list.push(item);
      catMap.set(catName, list);
    });

    const categories = Array.from(catMap.entries()).map(([categoryName, items]) => {
      return {
        categoryName,
        items,
      };
    });

    categories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));

    return categories;
  }, [filteredManualRules]);

  // Total issues count for tab badge
  const totalIssuesCount = useMemo(() => {
    const automatedIssues = findings.filter((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      return rule && rule.tier !== 'manual' && (f.status === 'fail' || f.status === 'warning');
    }).length;
    return automatedIssues + manualList.length;
  }, [findings, effectiveRules, manualList]);

  // Screen names lookup for findings (Item 6)
  const getScreenNamesForFinding = (finding: RuleFinding): string => {
    if (auditTargetScreenId !== 'all') {
      const matched = screens.find((s) => s.id === auditTargetScreenId || s.id === effectiveScreenId);
      return matched ? matched.name : (targetScreenDef?.name || 'Current Screen');
    }
    if (finding.screenId && finding.screenId !== 'all') {
      const matched = screens.find((s) => s.id === finding.screenId);
      if (matched) return matched.name;
    }
    // Scope is All Screens (Project-Wide): list the screens with active content
    const activeScreenNames = screens
      .filter((s) => (componentsByScreen[s.id] || []).length > 0)
      .map((s) => s.name);
    if (activeScreenNames.length > 0) {
      return activeScreenNames.join(', ');
    }
    return screens.map((s) => s.name).join(', ') || 'All Screens';
  };

  // Screen names lookup for static and runtime rule cards (v6 Item 3)
  const getRuleScreenNames = (ruleGroup: {
    affectedInstances: { screenId?: string }[];
    fails: RuleFinding[];
    warnings: RuleFinding[];
    passes: RuleFinding[];
  }): string => {
    const screenIdSet = new Set<string>();

    ruleGroup.affectedInstances.forEach((inst) => {
      if (inst.screenId && inst.screenId !== 'all') screenIdSet.add(inst.screenId);
    });
    ruleGroup.fails.forEach((f) => {
      if (f.screenId && f.screenId !== 'all') screenIdSet.add(f.screenId);
    });
    ruleGroup.warnings.forEach((f) => {
      if (f.screenId && f.screenId !== 'all') screenIdSet.add(f.screenId);
    });

    if (screenIdSet.size === 0) {
      ruleGroup.passes.forEach((p) => {
        if (p.screenId && p.screenId !== 'all') screenIdSet.add(p.screenId);
      });
    }

    if (screenIdSet.size > 0) {
      const matchedNames: string[] = [];
      screens.forEach((s) => {
        if (screenIdSet.has(s.id)) {
          matchedNames.push(s.name);
        }
      });
      screenIdSet.forEach((id) => {
        if (!screens.some((s) => s.id === id)) {
          matchedNames.push(id);
        }
      });
      if (matchedNames.length > 0) {
        return matchedNames.join(', ');
      }
    }

    if (auditTargetScreenId !== 'all') {
      const matched = screens.find((s) => s.id === auditTargetScreenId || s.id === effectiveScreenId);
      return matched ? matched.name : (targetScreenDef?.name || 'Current Screen');
    }

    const activeScreenNames = screens
      .filter((s) => (componentsByScreen[s.id] || []).length > 0)
      .map((s) => s.name);
    if (activeScreenNames.length > 0) {
      return activeScreenNames.join(', ');
    }

    return screens.map((s) => s.name).join(', ') || 'All Screens';
  };

  // Formatting for finding measurement and threshold (v6 Item 1)
  const formatFindingMeasurement = (inst: { measured?: string; threshold?: string; message: string }) => {
    if (inst.measured) {
      if (inst.threshold) {
        let thresholdPart = inst.threshold;
        if (thresholdPart.startsWith('≥')) {
          thresholdPart = `needs at least ${thresholdPart.replace(/^≥\s*/, '')}`;
        } else if (thresholdPart.startsWith('>')) {
          thresholdPart = `needs more than ${thresholdPart.replace(/^>\s*/, '')}`;
        } else if (thresholdPart.startsWith('≤')) {
          thresholdPart = `needs at most ${thresholdPart.replace(/^≤\s*/, '')}`;
        } else if (thresholdPart.startsWith('<')) {
          thresholdPart = `needs less than ${thresholdPart.replace(/^<\s*/, '')}`;
        } else if (thresholdPart.toLowerCase().startsWith('needs ')) {
          thresholdPart = thresholdPart;
        } else {
          thresholdPart = `needs ${thresholdPart}`;
        }
        return `${inst.measured} — ${thresholdPart}`;
      }
      return inst.measured;
    }
    return inst.message;
  };

  const handleSelectOnCanvas = (instanceId?: string, screenId?: string) => {
    if (!instanceId) return;
    setScreenMode('editor');
    if (screenId && screenId !== 'all' && screenId !== activeView) {
      setActiveView(screenId);
    }
    selectComponent(instanceId);
  };

  const handleTierTabChange = (tier: 'static' | 'runtime' | 'manual') => {
    setActiveTierTab(tier);
    setSelectedTierFilter(tier);
    setSelectedCategoryFilter('all');
  };

  const handleSummarySegmentClick = (tier: 'static' | 'runtime' | 'manual') => {
    if (selectedTierFilter === tier) {
      setSelectedTierFilter('all');
    } else {
      setSelectedTierFilter(tier);
      setActiveTierTab(tier);
    }
  };

  const toggleExpandPass = (id: string) => {
    setExpandedPassIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpandRuleCard = (ruleId: string) => {
    setExpandedRuleCards((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const handleSimulateTestInteraction = () => {
    const simulatedLatency = Math.floor(16 + Math.random() * 25);
    const simulatedResponse = Math.floor(120 + Math.random() * 280);

    recordRuntimeInteraction({
      eventType: 'tap',
      targetType: 'climate-control',
      screenId: effectiveScreenId === 'all' ? 'home' : effectiveScreenId,
      latencyMs: simulatedLatency,
      responseTimeMs: simulatedResponse,
      details: 'Simulated user tap on HVAC temperature control',
    });
  };

  const handleExportReport = (format: 'json' | 'html') => {
    const screenNotes = hmiAuditNotes[effectiveScreenId] || {};
    const reportData = generateAuditReportJson(findings, auditContext, screenName, screenNotes);

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mockpit-hmi-audit-${effectiveScreenId}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportFeedback('Exported audit-report.json');
    } else {
      const html = generateAuditReportHtml(reportData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mockpit-hmi-audit-${effectiveScreenId}-${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setExportFeedback('Exported audit-report.html');
    }

    setTimeout(() => setExportFeedback(null), 3000);
  };

  // Filter Component Groups by search & status
  const filteredComponentList = useMemo(() => {
    const tierToFilter = selectedTierFilter !== 'all' ? selectedTierFilter : activeTierTab;

    return groupedComponentsData.componentList.filter((comp) => {
      // Filter issues by tier if selected
      let relevantFails = comp.fails;
      let relevantWarnings = comp.warnings;
      let relevantPasses = comp.passes;

      if (tierToFilter !== 'all') {
        relevantFails = comp.fails.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === tierToFilter);
        relevantWarnings = comp.warnings.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === tierToFilter);
        relevantPasses = comp.passes.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === tierToFilter);
      }

      const relevantIssuesCount = relevantFails.length + relevantWarnings.length;

      // Status filter
      if (selectedStatusFilter === 'issues') {
        if (relevantIssuesCount === 0) return false;
      } else if (selectedStatusFilter === 'pass') {
        if (relevantPasses.length === 0 || relevantIssuesCount > 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const displayName = getComponentDisplayName(comp.componentType);
        const compText = `${displayName} ${comp.componentType} ${comp.instanceId} ${comp.screenName || ''}`.toLowerCase();
        const ruleMatch = [...comp.issues, ...comp.passes].some((f) => {
          const rule = effectiveRules.find((r) => r.id === f.ruleId);
          return (
            (rule && `${rule.title} ${rule.id} ${rule.description}`.toLowerCase().includes(q)) ||
            (f.message && f.message.toLowerCase().includes(q)) ||
            (f.measured && String(f.measured).toLowerCase().includes(q))
          );
        });

        if (!compText.includes(q) && !ruleMatch) return false;
      }

      return true;
    });
  }, [groupedComponentsData.componentList, selectedTierFilter, activeTierTab, selectedStatusFilter, searchQuery, effectiveRules]);

  // Filter Screen-level findings group
  const filteredScreenLevelGroup = useMemo(() => {
    const group = groupedComponentsData.screenLevelGroup;
    let fails = group.fails;
    let warnings = group.warnings;
    let passes = group.passes;

    if (selectedTierFilter !== 'all') {
      fails = fails.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
      warnings = warnings.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
      passes = passes.filter((f) => effectiveRules.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
    }

    if (selectedStatusFilter === 'issues') {
      passes = [];
    } else if (selectedStatusFilter === 'pass') {
      fails = [];
      warnings = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFilter = (f: RuleFinding) => {
        const rule = effectiveRules.find((r) => r.id === f.ruleId);
        return (
          (rule && `${rule.title} ${rule.id} ${rule.description}`.toLowerCase().includes(q)) ||
          (f.message && f.message.toLowerCase().includes(q))
        );
      };
      fails = fails.filter(matchFilter);
      warnings = warnings.filter(matchFilter);
      passes = passes.filter(matchFilter);
    }

    return {
      fails,
      warnings,
      passes,
      totalIssues: fails.length + warnings.length,
      totalFindings: fails.length + warnings.length + passes.length,
    };
  }, [groupedComponentsData.screenLevelGroup, selectedTierFilter, selectedStatusFilter, searchQuery]);

  return (
    <div className="bg-slate-900 w-full h-full flex flex-col overflow-hidden text-slate-100 font-sans">
      {/* Row 1 (identity): icon + title, Close button. Nothing else. */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight text-slate-100">
            HMI Compliance & Safety Audit
          </h2>
        </div>

        <button
          onClick={() => setScreenMode('editor')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Audit Mode"
          aria-label="Close Audit Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body content based on active tab */}
      {activeAuditTab === 'registry' ? (
        <RuleRegistryBrowser onBackToFindings={() => setActiveAuditTab('findings')} />
      ) : (
        <>
          {/* Row 2 (toolbar): Scope selector → Search input → Filters button (with badge) → Rule Registry icon button (right-aligned) */}
          <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800 flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Scope selector (no 'Scope:' prefix) */}
            <select
              id="mockpit-scope-select"
              value={auditTargetScreenId}
              onChange={(e) => setAuditTargetScreenId(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-2.5 py-1 text-xs text-sky-300 font-bold font-mono outline-none cursor-pointer"
              title="Audit screen scope"
            >
              <option value="current" className="bg-slate-900 text-slate-100">
                Current ({screens.find((s) => s.id === activeView)?.name || activeView})
              </option>
              <option value="all" className="bg-slate-900 text-slate-100">
                All Screens (Project-Wide)
              </option>
              {screens.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  Screen: {s.name}
                </option>
              ))}
            </select>

            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rules, tokens..."
                className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 font-mono outline-none w-36 sm:w-56"
              />
            </div>

            {/* Filters button with badge & popover */}
            <div className="relative" ref={filtersPopoverRef}>
              <button
                type="button"
                id="mockpit-audit-filters-btn"
                onClick={() => setIsFiltersOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
                  isFiltersOpen || activeFiltersCount > 0
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Filter rules by status and category"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span
                    id="mockpit-audit-filters-badge"
                    className="px-1.5 py-0.2 rounded-full bg-sky-400 text-slate-950 font-bold text-[10px] flex items-center justify-center leading-none"
                  >
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Filters Popover */}
              {isFiltersOpen && (
                <div
                  id="mockpit-audit-filters-popover"
                  className="absolute left-0 top-full mt-1.5 z-50 w-72 p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col gap-3 font-mono text-xs animate-in fade-in zoom-in-95"
                >
                  {/* Popover Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">Filters</span>
                    {activeFiltersCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStatusFilter('all');
                          setSelectedCategoryFilter('all');
                        }}
                        className="text-[11px] text-sky-400 hover:underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Status
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('all')}
                        className={`py-1 rounded text-center transition-colors cursor-pointer ${
                          selectedStatusFilter === 'all'
                            ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        All ({findings.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('issues')}
                        className={`py-1 rounded text-center transition-colors cursor-pointer ${
                          selectedStatusFilter === 'issues'
                            ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Issues ({totalIssuesCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('pass')}
                        className={`py-1 rounded text-center transition-colors cursor-pointer ${
                          selectedStatusFilter === 'pass'
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Passed
                      </button>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hmi-category-filter-select"
                      className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block"
                    >
                      Category
                    </label>
                    <select
                      id="hmi-category-filter-select"
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono outline-none cursor-pointer"
                      title="Filter rules by category"
                    >
                      <option value="all">All Categories</option>
                      {availableCategoriesForCurrentTab.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Rule Registry Icon Button (Right-aligned) */}
            <div className="flex items-center ml-auto">
              <button
                type="button"
                id="mockpit-audit-btn-registry"
                onClick={() => setActiveAuditTab('registry')}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                title="Rule Registry"
                aria-label="Rule Registry"
              >
                <BookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 3 (conditional): active-filters summary line, only rendered when status ≠ "All" or category ≠ "All Categories" */}
          {activeFilterSummaryParts.length > 0 && (
            <div
              id="mockpit-active-filters-summary"
              className="px-5 py-1.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-300 shrink-0"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Filtering by:</span>
                <span className="text-sky-300 font-semibold">
                  {activeFilterSummaryParts.join(' · ')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStatusFilter('all');
                  setSelectedCategoryFilter('all');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}

            {/* Toolbar: Secondary Row (Icon-only, reduced weight: Group-by, Simulate Touch, Export) */}
            <div className="px-5 py-1 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                {/* Group By Toggle (Rule / Component) */}
                {activeTierTab !== 'manual' && (
                  <div className="flex items-center gap-0.5 bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setGroupBy('rule')}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        groupBy === 'rule'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Group findings by rule definition (default)"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setGroupBy('component')}
                      className={`p-1 rounded transition-colors cursor-pointer ${
                        groupBy === 'component'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title="Group findings by component instance"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Test Simulation Button (Icon-only) */}
                <button
                  onClick={handleSimulateTestInteraction}
                  className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Simulate touch interaction to measure latency"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                {/* Export Buttons (Icon-only) */}
                <button
                  onClick={() => handleExportReport('json')}
                  className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Export Audit Report as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExportReport('html')}
                  className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Export Audit Report as HTML"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Export Feedback Toast */}
            {exportFeedback && (
              <div className="px-5 py-2 bg-slate-800 border-b border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-between shrink-0 animate-in fade-in">
                <span>{exportFeedback}</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
            )}

            {/* Tier Navigation Tabs */}
            <div className="px-5 pt-2 pb-0 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleTierTabChange('static')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'static'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Static</span>
                {summaries.static.fail > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {summaries.static.fail} fail
                  </span>
                ) : summaries.static.warning > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {summaries.static.warning} warn
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleTierTabChange('runtime')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'runtime'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Runtime</span>
                {summaries.runtime.fail > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    {summaries.runtime.fail} fail
                  </span>
                ) : summaries.runtime.notMeasured > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600">
                    {summaries.runtime.notMeasured} not measured
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleTierTabChange('manual')}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'manual'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Manual Review</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  {manualList.length}
                </span>
              </button>
            </div>

        {/* Scrollable Findings List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTierTab === 'manual' ? (
            categoryGroupedManualRules.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-sm bg-slate-950/30 rounded-xl border border-slate-800/60">
                No matching manual review rules.
              </div>
            ) : (
              <div className="space-y-6">
                {categoryGroupedManualRules.map((cat, catIdx) => (
                  <div key={cat.categoryName} className="space-y-3">
                    {/* Category Section Heading (Item 2 & 4: 20px, bold, text-slate-400) */}
                    <div className={`pb-1.5 flex items-center justify-between border-b border-slate-800/60 ${catIdx > 0 ? 'pt-3' : 'pt-0'}`}>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-[20px] font-bold text-slate-400 tracking-tight">
                          {cat.categoryName}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          {cat.items.length} {cat.items.length === 1 ? 'rule' : 'rules'}
                        </span>
                      </div>
                    </div>

                    {/* Manual Review Cards (Item 8: Flattened) */}
                    <div className="space-y-3">
                      {cat.items.map(({ rule, finding }) => (
                        <div
                          key={rule.id}
                          className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all divide-y divide-slate-800/60"
                        >
                          {/* Header row: Headline (Item 2 & 4: 17px, font-semibold, text-slate-200; Item 5: No Needs Review badge) */}
                          <div className="pb-3">
                            <h4 className="text-[17px] font-semibold text-slate-200">
                              {rule.plainHeadline || rule.title}
                            </h4>
                          </div>

                          {/* To Do (renamed from "What to look for", Items 2 & 7: 13px label, 14px body) */}
                          {(rule.fixGuidance || rule.description) && (
                            <div className="py-3 space-y-1">
                              <span className="text-[13px] font-semibold text-slate-400 block">To Do</span>
                              <p className="text-sm leading-relaxed text-slate-300">{rule.fixGuidance || rule.description}</p>
                            </div>
                          )}

                          {/* Screens (Item 6: 13px label, 14px body with real screen names) */}
                          <div className="py-3 space-y-1">
                            <span className="text-[13px] font-semibold text-slate-400 block">Screens</span>
                            <p className="text-sm text-slate-300">{getScreenNamesForFinding(finding)}</p>
                          </div>

                          {/* Estimate (Item 8: merged single glance estimate rounded to whole number; 13px label, 14px body) */}
                          {finding.heuristicGlanceCount !== undefined && (
                            <div className="py-3 space-y-1">
                              <span className="text-[13px] font-semibold text-slate-400 block">Estimate</span>
                              <p className="text-sm text-slate-300">
                                About {Math.round(finding.heuristicGlanceCount)} glances to parse this screen (heuristic)
                              </p>
                            </div>
                          )}

                          {/* Contextual message if custom and not glance estimate or description */}
                          {finding.message &&
                            finding.heuristicGlanceCount === undefined &&
                            finding.message !== rule.description && (
                              <div className="py-3 space-y-1">
                                <span className="text-[13px] font-semibold text-slate-400 block">Context</span>
                                <p className="text-sm text-slate-300">{finding.message}</p>
                              </div>
                          )}

                          {/* Simplified Footer Meta Line (Item 1: inline adjacent text + icon with ~6px gap; Item 2: 14px) */}
                          <div className="pt-3 flex items-center gap-1.5 text-sm font-mono text-slate-400">
                            {rule.standardRef && (
                              <span className="text-slate-400 font-mono text-sm">{rule.standardRef}</span>
                            )}
                            <RuleInfoAffordance rule={rule} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <>
              {/* Runtime Unmeasured Rules Consolidated Banner (v1.1 §3) */}
              {activeTierTab === 'runtime' &&
                unmeasuredRuntimeRules.length > 0 &&
                selectedStatusFilter !== 'pass' && (
                  <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        <strong className="text-slate-200">
                          {unmeasuredRuntimeRules.length} runtime{' '}
                          {unmeasuredRuntimeRules.length === 1 ? 'metric' : 'metrics'}
                        </strong>{' '}
                        not yet measured ({unmeasuredRuntimeRules.map((r) => r.title).join(', ')}) — run a
                        Preview session to collect them.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSimulateTestInteraction}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Simulate Touch
                    </button>
                  </div>
                )}

              {/* Section: Findings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                      {groupBy === 'rule'
                        ? `Findings (${currentTabRules.length} rules)`
                        : `Findings (${filteredComponentList.length} components)`}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {groupBy === 'rule'
                      ? 'Grouped by rule • Sorted by severity'
                      : 'Grouped by component • Sorted by issue count'}
                  </span>
                </div>

            {/* View Mode: Component-First (Default v1.2) */}
            {groupBy === 'component' ? (
              <div className="space-y-3">
                {/* Screen-level findings if any */}
                {filteredScreenLevelGroup.totalFindings > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-sky-400" />
                        <span className="text-sm font-bold text-slate-100 font-mono">Screen & System Level</span>
                        <span className="text-xs text-slate-400 font-mono">({screenName})</span>
                      </div>
                      {filteredScreenLevelGroup.totalIssues > 0 ? (
                        <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${
                          filteredScreenLevelGroup.fails.length > 0
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {filteredScreenLevelGroup.totalIssues} Issue{filteredScreenLevelGroup.totalIssues > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Pass
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {filteredScreenLevelGroup.fails.map((f, idx) => {
                        const rule = effectiveRules.find((r) => r.id === f.ruleId);
                        return (
                          <div
                            key={`screen-fail-${idx}`}
                            className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span className="font-semibold text-base text-rose-200 shrink-0">{rule?.title || f.ruleId}</span>
                              <span className="text-slate-300 text-sm truncate">{f.message}</span>
                            </div>
                            {rule && <RuleInfoAffordance rule={rule} />}
                          </div>
                        );
                      })}

                      {filteredScreenLevelGroup.warnings.map((f, idx) => {
                        const ruleItem = effectiveRules.find((r) => r.id === f.ruleId);
                        return (
                          <div
                            key={`screen-warn-${idx}`}
                            className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-base text-slate-300 shrink-0">{ruleItem?.title || f.ruleId}</span>
                              <span className="text-slate-300 text-sm truncate">{f.message}</span>
                            </div>
                            {ruleItem && <RuleInfoAffordance rule={ruleItem} />}
                          </div>
                        );
                      })}

                      {filteredScreenLevelGroup.passes.map((f, idx) => {
                        const rule = effectiveRules.find((r) => r.id === f.ruleId);
                        return (
                          <div
                            key={`screen-pass-${idx}`}
                            className="flex items-center justify-between gap-3 py-1 px-2 rounded-lg bg-slate-900/20 border border-slate-800 text-xs font-mono"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-300 font-semibold text-base shrink-0">{rule?.title || f.ruleId}</span>
                              <span className="text-slate-400 text-sm truncate">{f.message}</span>
                            </div>
                            {rule && <RuleInfoAffordance rule={rule} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Component List */}
                {filteredComponentList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
                    {selectedStatusFilter === 'issues'
                      ? '✓ No component issues found for current filter.'
                      : 'No matching components.'}
                  </div>
                ) : (
                  filteredComponentList.map((comp) => {
                    const hasFails = comp.fails.length > 0;
                    const hasWarnings = comp.warnings.length > 0;

                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> All checks passed
                      </span>
                    );

                    if (hasFails) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> {comp.fails.length} Fail{comp.fails.length > 1 ? 's' : ''}
                          {hasWarnings && ` • ${comp.warnings.length} Warn`}
                        </span>
                      );
                    } else if (hasWarnings) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {comp.warnings.length} Warn
                        </span>
                      );
                    }

                    return (
                      <div
                        key={comp.instanceId}
                        id={`component-card-${comp.instanceId}`}
                        data-component-target={comp.instanceId}
                        data-instance-target={comp.instanceId}
                        className={`bg-slate-950/60 border rounded-xl p-3.5 transition-all space-y-2.5 ${
                          hasFails
                            ? 'border-rose-900/50 hover:border-rose-700/60'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Component Card Header */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2.5">
                            <div className="font-mono font-bold text-lg text-slate-100">
                              {getComponentDisplayName(comp.componentType)}
                            </div>
                            {auditTargetScreenId === 'all' && comp.screenName && (
                              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                                {comp.screenName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {statusBadge}
                            <button
                              onClick={() => handleSelectOnCanvas(comp.instanceId, comp.screenId)}
                              className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-mono shrink-0 cursor-pointer transition-colors"
                              title="Highlight and select component on the visual canvas"
                            >
                              <MousePointer className="w-3 h-3" /> Select on canvas
                            </button>
                          </div>
                        </div>

                        {/* List of Component Findings */}
                        <div className="space-y-1.5 pt-0.5">
                          {/* Fails */}
                          {comp.fails.map((fFinding) => {
                            const rule = effectiveRules.find((r) => r.id === fFinding.ruleId);
                            return (
                              <div
                                key={`comp-fail-${fFinding.ruleId}`}
                                className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs font-mono"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                  <span className="font-semibold text-sm text-rose-200 shrink-0">
                                    {rule?.plainHeadline || rule?.title || fFinding.ruleId}
                                  </span>
                                  <span className="text-slate-300 text-xs truncate">
                                    {fFinding.measured
                                      ? `${fFinding.measured} (${fFinding.threshold ? `needs ${fFinding.threshold}` : fFinding.message})`
                                      : fFinding.message}
                                  </span>
                                </div>
                                {rule && <RuleInfoAffordance rule={rule} />}
                              </div>
                            );
                          })}

                          {/* Warnings */}
                          {comp.warnings.map((wFinding) => {
                            const rule = effectiveRules.find((r) => r.id === wFinding.ruleId);
                            return (
                              <div
                                key={`comp-warn-${wFinding.ruleId}`}
                                className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="font-semibold text-sm text-slate-300 shrink-0">
                                    {rule?.plainHeadline || rule?.title || wFinding.ruleId}
                                  </span>
                                  <span className="text-slate-300 text-xs truncate">
                                    {wFinding.measured
                                      ? `${wFinding.measured} (${wFinding.threshold ? `needs ${wFinding.threshold}` : wFinding.message})`
                                      : wFinding.message}
                                  </span>
                                </div>
                                {rule && <RuleInfoAffordance rule={rule} />}
                              </div>
                            );
                          })}

                          {/* Collapsible Passing Findings for this Component */}
                          {comp.passes.length > 0 && (
                            <div className="space-y-1 pt-0.5">
                              <button
                                onClick={() => toggleExpandPass(`comp-${comp.instanceId}`)}
                                className="w-full flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs font-mono text-slate-400 transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{comp.passes.length} {comp.passes.length === 1 ? 'check passed' : 'checks passed'}</span>
                                </span>
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                  {expandedPassIds[`comp-${comp.instanceId}`] ? '[hide]' : '[show]'}
                                </span>
                              </button>

                              {expandedPassIds[`comp-${comp.instanceId}`] && (
                                <div className="space-y-1 pl-3 border-l border-slate-800 animate-in fade-in duration-100">
                                  {comp.passes.map((pFinding, idx) => {
                                    const rule = effectiveRules.find((r) => r.id === pFinding.ruleId);
                                    return (
                                      <div
                                        key={`comp-pass-${pFinding.ruleId}-${idx}`}
                                        className="flex items-center justify-between text-xs font-mono text-slate-400 py-0.5 px-2"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                          <span className="text-slate-300 font-semibold text-xs shrink-0">
                                            {rule?.plainHeadline || rule?.title || pFinding.ruleId}
                                          </span>
                                          {pFinding.measured && (
                                            <span className="text-slate-500 text-xs truncate">({pFinding.measured})</span>
                                          )}
                                        </div>
                                        {rule && <RuleInfoAffordance rule={rule} />}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* View Mode: Rule-First (Default) */
              <div className="space-y-6">
                {categoryGroupedRules.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
                    {selectedStatusFilter === 'issues'
                      ? '✓ No issues found for current filter.'
                      : 'No matching rules.'}
                  </div>
                ) : (
                  categoryGroupedRules.map((cat, catIdx) => (
                    <div key={cat.categoryName} className="space-y-3">
                      {/* Category Section Heading (Item 2 & 4: 20px, bold, text-slate-400) */}
                      <div className={`pb-1.5 flex items-center justify-between border-b border-slate-800/60 ${catIdx > 0 ? 'pt-3' : 'pt-0'}`}>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[20px] font-bold text-slate-400 tracking-tight">
                            {cat.categoryName}
                          </h3>
                          {cat.totalFails > 0 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                              {cat.totalFails} {cat.totalFails === 1 ? 'fail' : 'fails'}
                            </span>
                          ) : cat.totalWarnings > 0 ? (
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/50 text-amber-300 border border-amber-800/50">
                              {cat.totalWarnings} {cat.totalWarnings === 1 ? 'warn' : 'warns'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Passing
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {cat.rules.length} {cat.rules.length === 1 ? 'rule' : 'rules'}
                        </span>
                      </div>

                      {/* Rule cards for this category */}
                      <div className="space-y-3">
                        {cat.rules.map((ruleGroup) => {
                          const { rule, fails, warnings, passes, notMeasured, affectedInstances } = ruleGroup;
                          const hasFails = fails.length > 0;
                          const hasWarnings = warnings.length > 0;
                          const hasNotMeasured = notMeasured.length > 0;

                          let statusBadge = (
                            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 shrink-0">
                              <Check className="w-3.5 h-3.5 text-slate-400" /> Pass
                            </span>
                          );

                          if (hasFails) {
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-800/80 flex items-center gap-1 shrink-0">
                                <XCircle className="w-3.5 h-3.5 text-rose-400" /> {fails.length} Fail{fails.length > 1 ? 's' : ''}
                                {hasWarnings && ` · ${warnings.length} Warn`}
                              </span>
                            );
                          } else if (hasWarnings) {
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800/60 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> {warnings.length} Warn{warnings.length > 1 ? 'ings' : 'ing'}
                              </span>
                            );
                          } else if (hasNotMeasured) {
                            statusBadge = (
                              <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-slate-400" /> Not Measured
                              </span>
                            );
                          }

                          const isRuleExpanded = !!expandedRuleCards[rule.id];

                          return (
                            <div
                              key={rule.id}
                              id={`rule-card-${rule.id}`}
                              className={`bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all ${
                                isRuleExpanded ? 'space-y-3' : ''
                              }`}
                            >
                              {/* Rule Card Header (Item 2 & 4: 17px, font-semibold, text-slate-200) */}
                              <div
                                className="flex items-start justify-between gap-3 flex-wrap cursor-pointer select-none"
                                onClick={() => toggleExpandRuleCard(rule.id)}
                              >
                                <div className="space-y-1 max-w-2xl">
                                  <h4 className="text-[17px] font-semibold text-slate-200">
                                    {rule.plainHeadline || rule.title}
                                  </h4>
                                </div>

                                <div
                                  className="flex items-center gap-2 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {statusBadge}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpandRuleCard(rule.id);
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title={isRuleExpanded ? 'Collapse rule details' : 'Expand rule details'}
                                  >
                                    {isRuleExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-slate-400" />
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Section 1: Affected Components List (Expanded only) */}
                              {isRuleExpanded && affectedInstances.length > 0 && (
                                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-semibold text-slate-400">
                                      Affected Components ({affectedInstances.length}{' '}
                                      {affectedInstances.length === 1 ? 'instance' : 'instances'})
                                    </span>
                                  </div>

                                  <div className="divide-y divide-slate-800/40">
                                    {affectedInstances.map((inst, idx) => (
                                      <div
                                        key={`${inst.instanceId}-${idx}`}
                                        className="flex items-center gap-3 py-2"
                                      >
                                        {/* Thumbnail placeholder box - clickable to select on canvas (v6 Item 2) */}
                                        <div
                                          onClick={() => handleSelectOnCanvas(inst.instanceId, inst.screenId)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              handleSelectOnCanvas(inst.instanceId, inst.screenId);
                                            }
                                          }}
                                          tabIndex={0}
                                          role="button"
                                          aria-label={`Select ${getComponentDisplayName(inst.componentType)} on canvas`}
                                          title="Select on canvas"
                                          className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500 cursor-pointer hover:border-sky-500/50 transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
                                        >
                                          <LayoutGrid className="w-5 h-5 text-slate-400" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-slate-200 text-sm">
                                            {getComponentDisplayName(inst.componentType)}
                                          </div>
                                          <div className="text-slate-400 text-sm">
                                            {formatFindingMeasurement(inst)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Collapsible Passing Instances (Expanded only) */}
                              {isRuleExpanded && passes.length > 0 && selectedStatusFilter !== 'issues' && (
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandPass(`rule-pass-${rule.id}`)}
                                    className="text-sm font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between w-full py-1 cursor-pointer"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Check className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        {passes.length} {passes.length === 1 ? 'instance passed' : 'instances passed'}
                                      </span>
                                    </span>
                                    <span className="text-slate-500 text-xs">
                                      {expandedPassIds[`rule-pass-${rule.id}`] ? '[hide]' : '[show]'}
                                    </span>
                                  </button>

                                  {expandedPassIds[`rule-pass-${rule.id}`] && (
                                    <div className="space-y-1 pl-4 border-l border-slate-800 animate-in fade-in duration-100 mt-1">
                                      {passes.map((pFinding, idx) => (
                                        <div
                                          key={`pass-${pFinding.instanceId || idx}`}
                                          className="flex items-center justify-between text-sm font-mono text-slate-400 py-0.5 px-2"
                                        >
                                          <div className="flex items-center gap-1.5">
                                            <Check className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-300 font-semibold">
                                              {pFinding.instanceId
                                                ? getComponentDisplayName(
                                                    componentsByScreen[effectiveScreenId]?.find(
                                                      (i) => i.id === pFinding.instanceId
                                                    )?.type || pFinding.instanceId
                                                  )
                                                : 'Screen'}
                                            </span>
                                            {pFinding.measured && (
                                              <span className="text-slate-500 text-sm">({pFinding.measured})</span>
                                            )}
                                          </div>
                                          {pFinding.instanceId && (
                                            <button
                                              type="button"
                                              onClick={() => handleSelectOnCanvas(pFinding.instanceId, pFinding.screenId)}
                                              className="text-sky-400 hover:underline cursor-pointer text-sm"
                                            >
                                              view
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Screens field (v6 Item 3) */}
                              {isRuleExpanded && (
                                <div className="space-y-1">
                                  <span className="text-[13px] font-semibold text-slate-400 block">Screens</span>
                                  <p className="text-sm text-slate-300">{getRuleScreenNames(ruleGroup)}</p>
                                </div>
                              )}

                              {/* Section 2: Recommended Fix Box */}
                              {isRuleExpanded && rule.fixGuidance && (
                                <div className="bg-sky-950/30 border border-sky-800/50 rounded-xl p-3 text-sm text-sky-200 flex items-start gap-2.5">
                                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-sky-300 block text-[13px]">Recommended Fix</span>
                                    <p className="leading-relaxed text-slate-300 text-sm">{rule.fixGuidance}</p>
                                  </div>
                                </div>
                              )}

                              {/* Footnote for ia.task-segmentation */}
                              {isRuleExpanded && rule.id === 'ia.task-segmentation' && (
                                <div className="text-sm font-mono text-slate-400 italic bg-slate-900/60 rounded-lg p-2.5 border border-slate-800/80">
                                  * State preservation is currently validated via activeTrip and project persistent state slices. This check always passes.
                                </div>
                              )}

                              {/* Section 3: Simplified Footer Meta Line (Item 1 & 2: inline group with ~6px gap; 14px font size) */}
                              {isRuleExpanded && (
                                <div className="pt-2.5 border-t border-slate-800/60 flex items-center gap-1.5 text-sm font-mono text-slate-400">
                                  {rule.standardRef && (
                                    <span className="text-slate-400 font-mono text-sm">{rule.standardRef}</span>
                                  )}
                                  <RuleInfoAffordance rule={rule} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
      </>
    )}
  </div>
);
};
