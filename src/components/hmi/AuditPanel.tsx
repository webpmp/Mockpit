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
import { RuleInfoAffordance } from './RuleInfoAffordance';
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
  const isAuditPanelOpen = useMockpitStore((s) => s.isAuditPanelOpen);
  const setAuditPanelOpen = useMockpitStore((s) => s.setAuditPanelOpen);
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

  // Grouping mode: component-first (default) vs rule-first
  const [groupBy, setGroupBy] = useState<'component' | 'rule'>('component');
  const [selectedTierFilter, setSelectedTierFilter] = useState<'all' | RuleTier>('all');
  // v1.1: Default to 'issues' filter
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'issues' | 'pass'>('issues');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [isManualReviewExpanded, setIsManualReviewExpanded] = useState(false);
  const [runtimeEntries, setRuntimeEntries] = useState(getRuntimeLog());
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  // State for expanded passing component lists
  const [expandedPassIds, setExpandedPassIds] = useState<Record<string, boolean>>({});

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
    return runAudit(auditContext);
  }, [auditContext]);

  // Summary counts per tier
  const summaries = useMemo(() => {
    const staticFindings = findings.filter((f) => {
      const rule = HMI_RULES.find((r) => r.id === f.ruleId);
      return rule?.tier === 'static';
    });
    const runtimeFindings = findings.filter((f) => {
      const rule = HMI_RULES.find((r) => r.id === f.ruleId);
      return rule?.tier === 'runtime';
    });
    const manualFindings = findings.filter((f) => {
      const rule = HMI_RULES.find((r) => r.id === f.ruleId);
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

  // Pinned Affected Components Summary List (v1.1 §4)
  const affectedComponents = useMemo(() => {
    const currentInstances = auditTargetScreenId === 'all'
      ? Object.values(componentsByScreen).flat()
      : (componentsByScreen[effectiveScreenId] || []);

    const map = new Map<string, { instanceId: string; type: string; screenId?: string; failCount: number; warnCount: number }>();
    findings.forEach((f) => {
      if ((f.status === 'fail' || f.status === 'warning') && f.instanceId) {
        const existing = map.get(f.instanceId) || {
          instanceId: f.instanceId,
          type: currentInstances.find((i) => i.id === f.instanceId)?.type || f.instanceId,
          screenId: f.screenId,
          failCount: 0,
          warnCount: 0,
        };
        if (f.status === 'fail') existing.failCount++;
        if (f.status === 'warning') existing.warnCount++;
        map.set(f.instanceId, existing);
      }
    });
    return Array.from(map.values());
  }, [findings, auditTargetScreenId, componentsByScreen, effectiveScreenId]);

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
      const rule = HMI_RULES.find((r) => r.id === f.ruleId);
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
      return a.componentType.localeCompare(b.componentType);
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

  // Group findings by rule for Automated & Manual categories
  const groupedRulesData = useMemo(() => {
    const screenNotes = hmiAuditNotes[effectiveScreenId] || {};

    // Group findings by ruleId
    const findingsByRule = new Map<string, RuleFinding[]>();
    findings.forEach((f) => {
      const list = findingsByRule.get(f.ruleId) || [];
      list.push(f);
      findingsByRule.set(f.ruleId, list);
    });

    const automatedList: Array<{
      rule: HMIRule;
      findings: RuleFinding[];
      fails: RuleFinding[];
      warnings: RuleFinding[];
      passes: RuleFinding[];
      notMeasured: RuleFinding[];
      severityRank: number; // 0 = fail, 1 = warning, 2 = pass, 3 = not measured
    }> = [];

    const unmeasuredRuntimeRules: HMIRule[] = [];

    const manualList: Array<{
      rule: HMIRule;
      finding: RuleFinding;
      isReviewed: boolean;
      note: string;
    }> = [];

    HMI_RULES.forEach((rule) => {
      const ruleFindings = findingsByRule.get(rule.id) || [];

      if (rule.tier === 'manual') {
        const noteEntry = screenNotes[rule.id] || { status: 'needs-review', note: '' };
        const finding = ruleFindings[0] || {
          ruleId: rule.id,
          status: 'needs-review',
          message: rule.description,
        };
        manualList.push({
          rule,
          finding,
          isReviewed: noteEntry.status === 'reviewed',
          note: noteEntry.note,
        });
      } else {
        // Static or Runtime
        const fails = ruleFindings.filter((f) => f.status === 'fail');
        const warnings = ruleFindings.filter((f) => f.status === 'warning');
        const passes = ruleFindings.filter((f) => f.status === 'pass');
        const notMeasured = ruleFindings.filter((f) => f.status === 'not-measured');

        // Check if this runtime rule is completely unmeasured
        if (rule.tier === 'runtime' && notMeasured.length > 0 && fails.length === 0 && warnings.length === 0 && passes.length === 0) {
          unmeasuredRuntimeRules.push(rule);
        } else {
          let severityRank = 2; // Pass
          if (fails.length > 0) severityRank = 0; // Fail first
          else if (warnings.length > 0) severityRank = 1; // Warn second

          automatedList.push({
            rule,
            findings: ruleFindings,
            fails,
            warnings,
            passes,
            notMeasured,
            severityRank,
          });
        }
      }
    });

    // Sort automated rules: Fails first (0), then Warnings (1), then Passes (2)
    automatedList.sort((a, b) => a.severityRank - b.severityRank);

    return {
      automatedList,
      unmeasuredRuntimeRules,
      manualList,
    };
  }, [findings, hmiAuditNotes, effectiveScreenId]);

  // Total issues count for tab badge
  const totalIssuesCount = useMemo(() => {
    const automatedIssues = findings.filter((f) => {
      const rule = HMI_RULES.find((r) => r.id === f.ruleId);
      return rule && rule.tier !== 'manual' && (f.status === 'fail' || f.status === 'warning');
    }).length;
    const manualNeedsReview = groupedRulesData.manualList.filter((m) => !m.isReviewed).length;
    return automatedIssues + manualNeedsReview;
  }, [findings, groupedRulesData.manualList]);

  const handleSelectOnCanvas = (instanceId?: string, screenId?: string) => {
    if (!instanceId) return;
    if (screenId && screenId !== 'all' && screenId !== activeView) {
      setActiveView(screenId);
    }
    selectComponent(instanceId);
  };

  const handleChipClick = (instanceId: string, screenId?: string) => {
    handleSelectOnCanvas(instanceId, screenId);
    // Smoothly scroll to the component card or finding element
    const element =
      document.getElementById(`component-card-${instanceId}`) ||
      document.querySelector(`[data-component-target="${instanceId}"]`) ||
      document.querySelector(`[data-instance-target="${instanceId}"]`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      element.classList.add('ring-2', 'ring-sky-400');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-sky-400');
      }, 1500);
    }
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
    return groupedComponentsData.componentList.filter((comp) => {
      // Filter issues by tier if selected
      let relevantFails = comp.fails;
      let relevantWarnings = comp.warnings;
      let relevantPasses = comp.passes;

      if (selectedTierFilter !== 'all') {
        relevantFails = comp.fails.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
        relevantWarnings = comp.warnings.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
        relevantPasses = comp.passes.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
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
        const compText = `${comp.componentType} ${comp.instanceId} ${comp.screenName || ''}`.toLowerCase();
        const ruleMatch = [...comp.issues, ...comp.passes].some((f) => {
          const rule = HMI_RULES.find((r) => r.id === f.ruleId);
          return (
            (rule && `${rule.title} ${rule.id} ${rule.description}`.toLowerCase().includes(q)) ||
            (f.message && f.message.toLowerCase().includes(q)) ||
            (f.measured && f.measured.toLowerCase().includes(q))
          );
        });

        if (!compText.includes(q) && !ruleMatch) return false;
      }

      return true;
    });
  }, [groupedComponentsData.componentList, selectedTierFilter, selectedStatusFilter, searchQuery]);

  // Filter Screen-level findings group
  const filteredScreenLevelGroup = useMemo(() => {
    const group = groupedComponentsData.screenLevelGroup;
    let fails = group.fails;
    let warnings = group.warnings;
    let passes = group.passes;

    if (selectedTierFilter !== 'all') {
      fails = fails.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
      warnings = warnings.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
      passes = passes.filter((f) => HMI_RULES.find((r) => r.id === f.ruleId)?.tier === selectedTierFilter);
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
        const rule = HMI_RULES.find((r) => r.id === f.ruleId);
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

  // Filter Automated rules by search & status
  const filteredAutomatedRules = groupedRulesData.automatedList.filter(({ rule, fails, warnings, passes }) => {
    if (selectedTierFilter !== 'all' && rule.tier !== selectedTierFilter) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter === 'issues') {
      if (fails.length === 0 && warnings.length === 0) return false;
    } else if (selectedStatusFilter === 'pass') {
      if (passes.length === 0) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${rule.title} ${rule.id} ${rule.description} ${rule.category}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Filter Manual rules by search & status
  const filteredManualRules = groupedRulesData.manualList.filter(({ rule, isReviewed, finding }) => {
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
      const matchText = `${rule.title} ${rule.id} ${rule.description} ${rule.category}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  if (!isAuditPanelOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[880px] flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
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
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  v1.0 Advisory
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Research-backed automotive timing, IA, legibility, and distraction standards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Screen Scope Picker */}
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

            {/* Close Button */}
            <button
              onClick={() => setAuditPanelOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Audit Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tier Summary Cards Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/90 grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          {/* Static Tier Summary */}
          <div
            onClick={() => setSelectedTierFilter(selectedTierFilter === 'static' ? 'all' : 'static')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedTierFilter === 'static'
                ? 'bg-slate-800/90 border-sky-500/60 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Static Analysis
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Automated</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> {summaries.static.pass} Pass
              </span>
              {summaries.static.fail > 0 && (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" /> {summaries.static.fail} Fail
                </span>
              )}
              {summaries.static.warning > 0 && (
                <span className="text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {summaries.static.warning} Warn
                </span>
              )}
            </div>
          </div>

          {/* Runtime Tier Summary */}
          <div
            onClick={() => setSelectedTierFilter(selectedTierFilter === 'runtime' ? 'all' : 'runtime')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedTierFilter === 'runtime'
                ? 'bg-slate-800/90 border-sky-500/60 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Runtime Metrics
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Session Log</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              {summaries.runtime.notMeasured > 0 ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> {summaries.runtime.notMeasured} Not Measured
                </span>
              ) : (
                <>
                  <span className="text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> {summaries.runtime.pass} Pass
                  </span>
                  {summaries.runtime.fail > 0 && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" /> {summaries.runtime.fail} Fail
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Manual Review Summary */}
          <div
            onClick={() => setSelectedTierFilter(selectedTierFilter === 'manual' ? 'all' : 'manual')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              selectedTierFilter === 'manual'
                ? 'bg-slate-800/90 border-sky-500/60 shadow-sm'
                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Manual Review
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">Checklist</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-slate-400" /> {summaries.manual.reviewed} Reviewed
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {summaries.manual.needsReview} Needs Review
              </span>
            </div>
          </div>
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
                  selectedStatusFilter === 'all' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({findings.length})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('issues')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  selectedStatusFilter === 'issues' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Issues ({totalIssuesCount})
              </button>
              <button
                onClick={() => setSelectedStatusFilter('pass')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  selectedStatusFilter === 'pass' ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Passed
              </button>
            </div>

            {/* Group By Toggle (v1.2) */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs font-mono">
              <span className="text-xs text-slate-500 pl-1.5 pr-0.5 select-none">Group:</span>
              <button
                onClick={() => setGroupBy('component')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  groupBy === 'component'
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Group findings by component instance (v1.2)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Component</span>
              </button>
              <button
                onClick={() => setGroupBy('rule')}
                className={`px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  groupBy === 'rule'
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Group findings by rule definition"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Rule</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Display Geometry Settings Accordion Button */}
            <button
              onClick={() => setIsConfigExpanded(!isConfigExpanded)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              <span>{displayConfig.displayDiagonalInches}" @ {displayConfig.viewingDistanceMM}mm</span>
              {isConfigExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

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
            </div>
          </div>
        </div>

        {/* Expandable Physical Display Geometry Settings */}
        {isConfigExpanded && (
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono animate-in slide-in-from-top-2 duration-150 shrink-0">
            <div>
              <label className="text-slate-400 block mb-1">Display Diagonal</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  value={displayConfig.displayDiagonalInches}
                  onChange={(e) => updateDisplayConfig({ displayDiagonalInches: Number(e.target.value) || 12.3 })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 w-full"
                />
                <span className="text-slate-500">in</span>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Physical Width</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  value={displayConfig.displayWidthMM}
                  onChange={(e) => updateDisplayConfig({ displayWidthMM: Number(e.target.value) || 272.3 })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 w-full"
                />
                <span className="text-slate-500">mm</span>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Physical Height</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="1"
                  value={displayConfig.displayHeightMM}
                  onChange={(e) => updateDisplayConfig({ displayHeightMM: Number(e.target.value) || 153.2 })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 w-full"
                />
                <span className="text-slate-500">mm</span>
              </div>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Viewing Distance</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="10"
                  value={displayConfig.viewingDistanceMM}
                  onChange={(e) => updateDisplayConfig({ viewingDistanceMM: Number(e.target.value) || 700 })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 w-full"
                />
                <span className="text-slate-500">mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Feedback Toast */}
        {exportFeedback && (
          <div className="px-5 py-2 bg-slate-800 border-b border-slate-700 text-slate-200 text-xs font-mono flex items-center justify-between shrink-0 animate-in fade-in">
            <span>{exportFeedback}</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
        )}

        {/* Pinned Affected Components Summary Chip Row (v1.1 §4) */}
        {affectedComponents.length > 0 ? (
          <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
            <span className="text-xs font-mono font-bold text-slate-300 shrink-0 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              {affectedComponents.length} {affectedComponents.length === 1 ? 'component needs' : 'components need'} attention:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap">
              {affectedComponents.map((comp) => (
                <button
                  key={comp.instanceId}
                  onClick={() => handleChipClick(comp.instanceId, comp.screenId)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer shrink-0"
                  title={`Select ${comp.type} on canvas and jump to findings`}
                >
                  <span className="font-semibold">{comp.type}</span>
                  {comp.failCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center">
                      {comp.failCount}
                    </span>
                  )}
                  {comp.warnCount > 0 && comp.failCount === 0 && (
                    <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
                      {comp.warnCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-mono text-slate-300">
              All components on screen pass automated tap-target, geometry, and contrast checks.
            </span>
          </div>
        )}

        {/* Scrollable Findings List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Runtime Unmeasured Rules Consolidated Banner (v1.1 §3) */}
          {groupedRulesData.unmeasuredRuntimeRules.length > 0 && selectedStatusFilter !== 'pass' && (
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-200">
                    {groupedRulesData.unmeasuredRuntimeRules.length} runtime {groupedRulesData.unmeasuredRuntimeRules.length === 1 ? 'metric' : 'metrics'}
                  </strong>{' '}
                  not yet measured ({groupedRulesData.unmeasuredRuntimeRules.map((r) => r.title).join(', ')}) — run a Preview session to collect them.
                </span>
              </div>
              <button
                onClick={handleSimulateTestInteraction}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-400" /> Simulate Touch
              </button>
            </div>
          )}

          {/* Section: Automated Findings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  {groupBy === 'component'
                    ? `Automated Findings (${filteredComponentList.length} components)`
                    : `Automated Findings (${filteredAutomatedRules.length} rules)`}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {groupBy === 'component' ? 'Grouped by component • Sorted by issue count' : 'Grouped by rule • Sorted by severity'}
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
                        const rule = HMI_RULES.find((r) => r.id === f.ruleId);
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
                        const ruleItem = HMI_RULES.find((r) => r.id === f.ruleId);
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
                        const rule = HMI_RULES.find((r) => r.id === f.ruleId);
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
                              {comp.componentType}
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
                            const rule = HMI_RULES.find((r) => r.id === fFinding.ruleId);
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
                            const rule = HMI_RULES.find((r) => r.id === wFinding.ruleId);
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
                                    const rule = HMI_RULES.find((r) => r.id === pFinding.ruleId);
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
              /* View Mode: Rule-First (v1.1 Grouping preserved as secondary toggle) */
              <div className="space-y-3">
                {filteredAutomatedRules.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
                    {selectedStatusFilter === 'issues'
                      ? '✓ No automated issues found for current filter.'
                      : 'No matching automated rules.'}
                  </div>
                ) : (
                  filteredAutomatedRules.map(({ rule, fails, warnings, passes }) => {
                    let ruleBadge: React.ReactNode = null;
                    if (fails.length > 0) {
                      ruleBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> {fails.length} Fail{fails.length > 1 ? 's' : ''}
                        </span>
                      );
                    } else if (warnings.length > 0) {
                      ruleBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {warnings.length} Warn
                        </span>
                      );
                    } else {
                      ruleBadge = (
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Pass
                        </span>
                      );
                    }

                    return (
                      <div
                        key={rule.id}
                        className="bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3.5 transition-all space-y-2.5"
                      >
                        {/* Rule Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                {rule.tier.toUpperCase()}
                              </span>
                              <span className="text-xs font-mono text-slate-500">{rule.id}</span>
                              <h4 className="text-base font-semibold text-slate-100">{rule.title}</h4>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                          </div>

                          <div className="shrink-0">{ruleBadge}</div>
                        </div>

                        {/* Result List for this rule */}
                        <div className="space-y-1.5 pt-1">
                          {/* Fail Rows */}
                          {fails.map((fFinding) => (
                            <div
                              key={`fail-${fFinding.instanceId || 'screen'}`}
                              data-instance-target={fFinding.instanceId}
                              className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span className="font-semibold text-sm text-rose-200 shrink-0">
                                  {fFinding.instanceId ? (auditContext.instances.find((i) => i.id === fFinding.instanceId)?.type || fFinding.instanceId) : 'Screen'}
                                </span>
                                <span className="text-slate-300 text-sm truncate">
                                  {fFinding.measured ? `${fFinding.measured} (${fFinding.threshold ? `needs ${fFinding.threshold}` : fFinding.message})` : fFinding.message}
                                </span>
                              </div>
                              {fFinding.instanceId && (
                                <button
                                  onClick={() => handleSelectOnCanvas(fFinding.instanceId, fFinding.screenId)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono shrink-0 cursor-pointer"
                                >
                                  <MousePointer className="w-3 h-3" /> Select on canvas
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Warning Rows */}
                          {warnings.map((wFinding) => (
                            <div
                              key={`warn-${wFinding.instanceId || 'screen'}`}
                              data-instance-target={wFinding.instanceId}
                              className="flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-sm text-slate-300 shrink-0">
                                  {wFinding.instanceId ? (auditContext.instances.find((i) => i.id === wFinding.instanceId)?.type || wFinding.instanceId) : 'Screen'}
                                </span>
                                <span className="text-slate-300 text-sm truncate">
                                  {wFinding.measured ? `${wFinding.measured} (${wFinding.threshold ? `needs ${wFinding.threshold}` : wFinding.message})` : wFinding.message}
                                </span>
                              </div>
                              {wFinding.instanceId && (
                                <button
                                  onClick={() => handleSelectOnCanvas(wFinding.instanceId, wFinding.screenId)}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono shrink-0 cursor-pointer"
                                >
                                  <MousePointer className="w-3 h-3" /> Select on canvas
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Collapsed Passing Summary */}
                          {passes.length > 0 && (
                            <div className="space-y-1.5 pt-0.5">
                              <button
                                onClick={() => toggleExpandPass(`rule-${rule.id}`)}
                                className="w-full flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs font-mono text-slate-400 transition-colors cursor-pointer"
                              >
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{passes.length} {passes.length === 1 ? 'component passed' : 'more passed'}</span>
                                </span>
                                <span className="text-slate-500 text-xs flex items-center gap-1">
                                  {expandedPassIds[`rule-${rule.id}`] ? '[hide]' : '[show]'}
                                </span>
                              </button>

                              {expandedPassIds[`rule-${rule.id}`] && (
                                <div className="space-y-1 pl-4 border-l border-slate-800 animate-in fade-in duration-100">
                                  {passes.map((pFinding, idx) => (
                                    <div
                                      key={`pass-${pFinding.instanceId || idx}`}
                                      className="flex items-center justify-between text-xs font-mono text-slate-400 py-0.5 px-2"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Check className="w-3.5 h-3.5 text-slate-400" />
                                        <span className="text-slate-300 font-semibold text-sm">
                                          {pFinding.instanceId ? (auditContext.instances.find((i) => i.id === pFinding.instanceId)?.type || pFinding.instanceId) : 'Screen'}
                                        </span>
                                        {pFinding.measured && <span className="text-slate-500 text-xs">({pFinding.measured})</span>}
                                      </div>
                                      {pFinding.instanceId && (
                                        <button
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
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Section: Manual Human Factors Review (v1.4 collapsible by default) */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <button
              onClick={() => setIsManualReviewExpanded(!isManualReviewExpanded)}
              className="w-full flex items-center justify-between pb-1 text-left cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 group-hover:text-slate-100 transition-colors">
                  Manual Human Factors Review ({filteredManualRules.length} items)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">
                  Qualitative workload & checklist assessment
                </span>
                {isManualReviewExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isManualReviewExpanded && (
              filteredManualRules.length === 0 ? (
                <div className="text-center py-6 text-slate-500 font-mono text-xs bg-slate-950/30 rounded-xl border border-slate-800/60">
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
                        </div>
                        {/* Description rendered ONCE cleanly */}
                        <p className="text-xs text-slate-400 leading-relaxed">{rule.description}</p>
                      </div>

                      <button
                        onClick={() => toggleAuditReviewStatus(effectiveScreenId, rule.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          isReviewed
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30'
                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {isReviewed ? <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{isReviewed ? 'Reviewed' : 'Needs Review'}</span>
                      </button>
                    </div>

                    {/* Contextual glance count or non-duplicate specific guidance */}
                    {(finding.heuristicGlanceCount !== undefined || (finding.message && finding.message !== rule.description)) && (
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
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/80 text-xs font-mono text-slate-500 flex items-center justify-between shrink-0">
          <div>
            HMI Rules v1.2 • Component-first audit view • 18 safety and ergonomic rules evaluated
          </div>
          <button
            onClick={() => setAuditPanelOpen(false)}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
