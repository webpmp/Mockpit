import React, { useState, useMemo, useEffect } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [runtimeEntries, setRuntimeEntries] = useState(getRuntimeLog());
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  // State for expanded passing component lists
  const [expandedPassIds, setExpandedPassIds] = useState<Record<string, boolean>>({});
  // State for expanded rule component sub-rows
  const [expandedRuleCompGroups, setExpandedRuleCompGroups] = useState<Record<string, boolean>>({});

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
    };
  }, [effectiveScreenId, auditTargetScreenId, componentsByScreen, screens, runtimeEntries, displayConfig, activeTrip]);

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

        group.affectedInstances.push({
          instanceId: f.instanceId,
          componentType,
          screenId: f.screenId,
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
          g.rule.title.toLowerCase().includes(q) ||
          g.rule.description.toLowerCase().includes(q) ||
          (g.rule.standardRef && g.rule.standardRef.toLowerCase().includes(q))
      );
    }

    if (selectedStatusFilter === 'issues') {
      list = list.filter((g) => g.fails.length + g.warnings.length > 0);
    } else if (selectedStatusFilter === 'pass') {
      list = list.filter((g) => g.fails.length + g.warnings.length === 0 && g.passes.length > 0);
    }

    list.sort((a, b) => b.fails.length + b.warnings.length - (a.fails.length + a.warnings.length));
    return list;
  }, [findings, effectiveRules, selectedTierFilter, selectedStatusFilter, searchQuery, componentsByScreen]);

  // Current tab rules (filters by active tier tab when selectedTierFilter is 'all')
  const currentTabRules = useMemo(() => {
    if (selectedTierFilter !== 'all') {
      return groupedRulesData;
    }
    return groupedRulesData.filter((g) => g.rule.tier === activeTierTab);
  }, [groupedRulesData, selectedTierFilter, activeTierTab]);

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
    const screenNotes = hmiAuditNotes[effectiveScreenId] || {};
    const findingsByRule = new Map<string, RuleFinding[]>();
    findings.forEach((f) => {
      const list = findingsByRule.get(f.ruleId) || [];
      list.push(f);
      findingsByRule.set(f.ruleId, list);
    });

    return effectiveRules
      .filter((rule) => rule.tier === 'manual')
      .map((rule) => {
        const noteEntry = screenNotes[rule.id] || { status: 'needs-review', note: '' };
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
          isReviewed: noteEntry.status === 'reviewed',
          note: noteEntry.note,
        };
      });
  }, [findings, effectiveRules, hmiAuditNotes, effectiveScreenId]);

  // Filter Manual rules by search & status
  const filteredManualRules = useMemo(() => {
    return manualList.filter(({ rule, isReviewed }) => {
      if (selectedTierFilter !== 'all' && rule.tier !== selectedTierFilter) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter === 'issues') {
        if (isReviewed) return false;
      } else if (selectedStatusFilter === 'pass') {
        if (!isReviewed) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${rule.title} ${rule.id} ${rule.description} ${rule.category} ${rule.standardRef || ''}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [manualList, selectedTierFilter, selectedStatusFilter, searchQuery]);

  // Total issues count for tab badge
  const totalIssuesCount = useMemo(() => {
    const automatedIssues = findings.filter((f) => {
      const rule = effectiveRules.find((r) => r.id === f.ruleId);
      return rule && rule.tier !== 'manual' && (f.status === 'fail' || f.status === 'warning');
    }).length;
    const manualNeedsReview = manualList.filter((m) => !m.isReviewed).length;
    return automatedIssues + manualNeedsReview;
  }, [findings, effectiveRules, manualList]);

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
  };

  const handleSummarySegmentClick = (tier: 'static' | 'runtime' | 'manual') => {
    if (selectedTierFilter === tier) {
      setSelectedTierFilter('all');
    } else {
      setSelectedTierFilter(tier);
      setActiveTierTab(tier);
    }
  };

  const toggleExpandRuleCompGroup = (key: string) => {
    setExpandedRuleCompGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleExpandPass = (id: string) => {
    setExpandedPassIds((prev) => ({
      ...prev,
      [id]: !prev[id],
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
      {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-mono tracking-tight text-slate-100">
                  HMI Compliance & Safety Audit
                </h2>
              </div>
              <p className="text-xs text-slate-400">
                Research-backed automotive timing, IA, legibility, and distraction standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Findings vs Rule Registry */}
            <div className="flex items-center bg-slate-900 border border-slate-700/80 p-0.5 rounded-xl text-xs font-mono">
              <button
                type="button"
                id="mockpit-audit-tab-findings"
                onClick={() => setActiveAuditTab('findings')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeAuditTab === 'findings'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audit Findings
              </button>
              <button
                type="button"
                id="mockpit-audit-tab-registry"
                onClick={() => setActiveAuditTab('registry')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  activeAuditTab === 'registry'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Rule Registry</span>
              </button>
            </div>

            {/* Screen Scope Picker */}
            {activeAuditTab === 'findings' && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-mono">
                <span className="text-slate-400">Scope:</span>
                <select
                  value={auditTargetScreenId}
                  onChange={(e) => setAuditTargetScreenId(e.target.value)}
                  className="bg-transparent text-sky-300 font-bold focus:outline-none cursor-pointer"
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
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => setScreenMode('editor')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Audit Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content based on active tab */}
        {activeAuditTab === 'registry' ? (
          <RuleRegistryBrowser />
        ) : (
          <>
            {/* Single-line Compact Stat Strip (Section 4d) */}
            <div className="px-5 py-2 border-b border-slate-800 bg-slate-900/90 flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto shrink-0 select-none">
              <button
                type="button"
                onClick={() => handleSummarySegmentClick('static')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  selectedTierFilter === 'static'
                    ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/40'
                    : 'hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Filter by Static Analysis tier"
              >
                <span className="text-emerald-400 font-medium">{summaries.static.pass} Pass</span>
                <span>·</span>
                <span className={summaries.static.fail > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {summaries.static.fail} Fail
                </span>
                <span>·</span>
                <span className={summaries.static.warning > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                  {summaries.static.warning} Warn
                </span>
              </button>

              <span className="text-slate-700">|</span>

              <button
                type="button"
                onClick={() => handleSummarySegmentClick('runtime')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  selectedTierFilter === 'runtime'
                    ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/40'
                    : 'hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Filter by Runtime Metrics tier"
              >
                {summaries.runtime.notMeasured > 0 ? (
                  <span className="text-slate-400">{summaries.runtime.notMeasured} Not Measured</span>
                ) : (
                  <>
                    <span className="text-emerald-400 font-medium">{summaries.runtime.pass} Pass</span>
                    {summaries.runtime.fail > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-rose-400 font-bold">{summaries.runtime.fail} Fail</span>
                      </>
                    )}
                  </>
                )}
              </button>

              <span className="text-slate-700">|</span>

              <button
                type="button"
                onClick={() => handleSummarySegmentClick('manual')}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  selectedTierFilter === 'manual'
                    ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/40'
                    : 'hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title="Filter by Manual Review tier"
              >
                <span className="text-slate-400">{summaries.manual.reviewed} Reviewed</span>
                <span>·</span>
                <span className={summaries.manual.needsReview > 0 ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                  {summaries.manual.needsReview} Needs Review
                </span>
              </button>
            </div>

            {/* Filter Controls & Search */}
            <div className="px-5 py-2.5 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search rules, tokens..."
                    className="bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-200 font-mono outline-none w-40 sm:w-48"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-mono">
                  <button
                    onClick={() => setSelectedStatusFilter('all')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      selectedStatusFilter === 'all'
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({findings.length})
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('issues')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      selectedStatusFilter === 'issues'
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Issues ({totalIssuesCount})
                  </button>
                  <button
                    onClick={() => setSelectedStatusFilter('pass')}
                    className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      selectedStatusFilter === 'pass'
                        ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Passed
                  </button>
                </div>

                {/* Group By Toggle (v1.2) - Default: Rule */}
                {activeTierTab !== 'manual' && (
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-mono">
                    <span className="text-xs text-slate-500 pl-1.5 pr-0.5 select-none">Group:</span>
                    <button
                      onClick={() => setGroupBy('rule')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        groupBy === 'rule'
                          ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Group findings by rule definition (default)"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>Rule</span>
                    </button>
                    <button
                      onClick={() => setGroupBy('component')}
                      className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                        groupBy === 'component'
                          ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Group findings by component instance"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Component</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Test Simulation Button */}
                <button
                  onClick={handleSimulateTestInteraction}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
                  title="Record a simulated touch interaction to measure latency"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Simulate Touch</span>
                </button>

                {/* Export Dropdown */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleExportReport('json')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                    title="Export Audit Report as JSON"
                  >
                    <Download className="w-3 h-3" /> JSON
                  </button>
                  <button
                    onClick={() => handleExportReport('html')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs font-mono text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                    title="Export Audit Report as HTML"
                  >
                    <FileText className="w-3 h-3" /> HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAuditTab('registry')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer ml-1"
                    title="Open HMI Rule Registry Browser"
                  >
                    <BookOpen className="w-3 h-3 text-sky-400" />
                    <span>Rule Registry</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Export Feedback Toast */}
            {exportFeedback && (
              <div className="px-5 py-2 bg-slate-800 border-b border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-between shrink-0 animate-in fade-in">
                <span>{exportFeedback}</span>
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
              </div>
            )}

            {/* Tier Navigation Tabs (Section 4c) */}
            <div className="px-5 pt-2 pb-0 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleTierTabChange('static')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'static'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Static ({summaries.static.fail})</span>
              </button>

              <button
                type="button"
                onClick={() => handleTierTabChange('runtime')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'runtime'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Runtime ({summaries.runtime.notMeasured > 0 ? summaries.runtime.notMeasured : summaries.runtime.fail})
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTierTabChange('manual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-t-lg border-b-2 transition-all cursor-pointer ${
                  activeTierTab === 'manual'
                    ? 'border-sky-400 text-sky-300 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Manual Review ({summaries.manual.needsReview})</span>
              </button>
            </div>

        {/* Scrollable Findings List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTierTab === 'manual' ? (
            filteredManualRules.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
                {selectedStatusFilter === 'issues'
                  ? '✓ All manual items marked as Reviewed.'
                  : 'No matching manual review rules.'}
              </div>
            ) : (
              filteredManualRules.map(({ rule, finding, isReviewed, note }) => (
                <div
                  key={rule.id}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          MANUAL
                        </span>
                        <span className="text-xs font-mono text-slate-500">{rule.id}</span>
                        <h4 className="text-base font-semibold text-slate-100">{rule.title}</h4>
                        {rule.standardRef && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60">
                            {rule.standardRef}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleAuditReviewStatus(effectiveScreenId, rule.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        isReviewed
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                          : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isReviewed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{isReviewed ? 'Reviewed' : 'Needs Review'}</span>
                    </button>
                  </div>

                  {/* Contextual glance count or non-duplicate specific guidance */}
                  {(finding.heuristicGlanceCount !== undefined ||
                    (finding.message && finding.message !== rule.description)) && (
                    <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                      {finding.message && finding.message !== rule.description && (
                        <div className="text-slate-300 flex-1 min-w-[200px]">
                          <span className="text-slate-500 mr-1.5">Context:</span>
                          {finding.message}
                        </div>
                      )}

                      {finding.heuristicGlanceCount !== undefined && (
                        <div className="text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 shrink-0">
                          Glance Estimate: ~{finding.heuristicGlanceCount} glances
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes Textarea */}
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">
                      Auditor Review Notes:
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setAuditNote(effectiveScreenId, rule.id, e.target.value)}
                      placeholder="Document human factors review, cognitive workload assessment, or exceptions..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-lg p-2 text-xs font-mono text-slate-200 outline-none resize-none transition-colors"
                    />
                  </div>
                </div>
              ))
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
                                  <span className="font-semibold text-base text-rose-200 shrink-0">
                                    {rule?.title || fFinding.ruleId}
                                  </span>
                                  <span className="text-slate-300 text-sm truncate">
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
                                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="font-semibold text-base text-slate-300 shrink-0">
                                    {rule?.title || wFinding.ruleId}
                                  </span>
                                  <span className="text-slate-300 text-sm truncate">
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
                                          <span className="text-slate-300 font-semibold text-sm shrink-0">
                                            {rule?.title || pFinding.ruleId}
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
              <div className="space-y-3">
                {currentTabRules.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
                    {selectedStatusFilter === 'issues'
                      ? '✓ No issues found for current filter.'
                      : 'No matching rules.'}
                  </div>
                ) : (
                  currentTabRules.map((ruleGroup) => {
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
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {warnings.length} Warn
                        </span>
                      );
                    } else if (hasNotMeasured) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Not Measured
                        </span>
                      );
                    }

                    const instancesByType = new Map<string, typeof affectedInstances>();
                    affectedInstances.forEach((inst) => {
                      const list = instancesByType.get(inst.componentType) || [];
                      list.push(inst);
                      instancesByType.set(inst.componentType, list);
                    });

                    return (
                      <div
                        key={rule.id}
                        id={`rule-card-${rule.id}`}
                        className={`bg-slate-950/60 border rounded-xl p-3.5 transition-all space-y-3 ${
                          hasFails
                            ? 'border-rose-900/50 hover:border-rose-700/60'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Rule Card Header */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {rule.tier.toUpperCase()}
                              </span>
                              <span className="text-xs font-mono text-slate-500">{rule.id}</span>
                              <h4 className="text-base font-semibold text-slate-100">{rule.title}</h4>
                              {rule.standardRef && (
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60">
                                  {rule.standardRef}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {statusBadge}
                            <RuleInfoAffordance rule={rule} />
                          </div>
                        </div>

                        {/* Affected Components List */}
                        {affectedInstances.length > 0 && (
                          <div className="space-y-2 pt-1 border-t border-slate-800/60">
                            <div className="text-xs font-mono text-slate-400 font-semibold flex items-center justify-between">
                              <span>
                                Affected Components ({affectedInstances.length}{' '}
                                {affectedInstances.length === 1 ? 'instance' : 'instances'})
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {Array.from(instancesByType.entries()).map(([compType, instList]) => {
                                const groupKey = `${rule.id}-${compType}`;
                                const isMulti = instList.length > 1;
                                const isExpanded = expandedRuleCompGroups[groupKey] ?? true;

                                return (
                                  <div
                                    key={groupKey}
                                    className="rounded-lg bg-slate-900/60 border border-slate-800/80 p-2 text-xs font-mono space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-200">
                                          {getComponentDisplayName(compType)}
                                        </span>
                                        {isMulti && (
                                          <span className="text-slate-500 text-xs">
                                            ({instList.length} instances)
                                          </span>
                                        )}
                                      </div>

                                      {isMulti && (
                                        <button
                                          type="button"
                                          onClick={() => toggleExpandRuleCompGroup(groupKey)}
                                          className="text-sky-400 hover:text-sky-300 text-xs cursor-pointer"
                                        >
                                          {isExpanded ? '[hide]' : `[show ${instList.length}]`}
                                        </button>
                                      )}
                                    </div>

                                    {(isExpanded || !isMulti) && (
                                      <div className="space-y-1 pl-1">
                                        {instList.map((inst, idx) => (
                                          <div
                                            key={`${inst.instanceId}-${idx}`}
                                            className="flex items-center justify-between gap-3 py-1 px-2 rounded bg-slate-950/40 border border-slate-800/50"
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              {inst.status === 'fail' ? (
                                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                              ) : (
                                                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                              )}
                                              <span className="text-slate-300 truncate">
                                                {inst.measured
                                                  ? `${inst.measured} (${inst.threshold ? `threshold: ${inst.threshold}` : inst.message})`
                                                  : inst.message}
                                              </span>
                                            </div>

                                            <button
                                              type="button"
                                              onClick={() => handleSelectOnCanvas(inst.instanceId, inst.screenId)}
                                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs shrink-0 cursor-pointer transition-colors"
                                              title="Highlight on visual canvas"
                                            >
                                              <MousePointer className="w-3 h-3" /> Select
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Passing Instances */}
                        {passes.length > 0 && selectedStatusFilter !== 'issues' && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpandPass(`rule-pass-${rule.id}`)}
                              className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center justify-between w-full py-1 cursor-pointer"
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
                                    className="flex items-center justify-between text-xs font-mono text-slate-400 py-0.5 px-2"
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
                                        <span className="text-slate-500 text-xs">({pFinding.measured})</span>
                                      )}
                                    </div>
                                    {pFinding.instanceId && (
                                      <button
                                        type="button"
                                        onClick={() => handleSelectOnCanvas(pFinding.instanceId, pFinding.screenId)}
                                        className="text-sky-400 hover:underline cursor-pointer text-xs"
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
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/80 text-xs font-mono text-slate-500 flex items-center justify-between shrink-0">
          <div>
            HMI Rules v1.2 • Component-first audit view • {effectiveRules.length} safety and ergonomic rules evaluated
          </div>
          <button
            onClick={() => setScreenMode('editor')}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </>
    )}
  </div>
);
};
