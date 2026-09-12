import React, { useState } from 'react';
import { useMockpitStore } from '../../store/useMockpitStore';
import {
  HMIRule,
  RuleProposal,
  RuleCategory,
  RuleTier,
  HMI_RULES,
} from '../../lib/hmiRules/registry';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Filter,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Info,
  Clock,
  Touchpad,
  Sparkles,
  Layers,
  Eye,
  Mic,
  Layout,
  FileText,
  Palette,
  X,
  FileCode,
  ArrowLeft,
} from 'lucide-react';

const CATEGORIES: { id: RuleCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'interaction', label: 'Interaction & Touch Ergonomics', icon: Touchpad },
  { id: 'timing', label: 'Timing & Latency Metrics', icon: Clock },
  { id: 'feedback', label: 'Feedback & Sensory Indicators', icon: Sparkles },
  { id: 'ia', label: 'Information Architecture & Depth', icon: Layers },
  { id: 'visual', label: 'Visual Ergonomics & Legibility', icon: Eye },
  { id: 'modality', label: 'Multimodal & Drive Lockouts', icon: Mic },
  { id: 'overlay', label: 'Overlay & Alerts Presentation', icon: Layout },
  { id: 'content', label: 'Content Glanceability & Wording', icon: FileText },
  { id: 'palette', label: 'Palette & Color Fidelity', icon: Palette },
];

interface RuleRegistryBrowserProps {
  onBackToFindings?: () => void;
}

export const RuleRegistryBrowser: React.FC<RuleRegistryBrowserProps> = ({ onBackToFindings }) => {
  const userDefinedManualRules = useMockpitStore((state) => state.userDefinedManualRules);
  const ruleProposals = useMockpitStore((state) => state.ruleProposals);
  const editedBaseManualRules = useMockpitStore((state) => state.editedBaseManualRules);
  const addUserDefinedManualRule = useMockpitStore((state) => state.addUserDefinedManualRule);
  const updateManualRule = useMockpitStore((state) => state.updateManualRule);
  const deleteUserDefinedManualRule = useMockpitStore((state) => state.deleteUserDefinedManualRule);
  const addRuleProposal = useMockpitStore((state) => state.addRuleProposal);
  const deleteRuleProposal = useMockpitStore((state) => state.deleteRuleProposal);
  const updateRuleProposalStatus = useMockpitStore((state) => state.updateRuleProposalStatus);

  // Filter state
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Form states
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Add Manual Rule form fields
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualCategory, setManualCategory] = useState<RuleCategory>('interaction');
  const [manualStandardRef, setManualStandardRef] = useState('');

  // Edit Manual Rule form fields
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState<RuleCategory>('interaction');
  const [editStandardRef, setEditStandardRef] = useState('');

  // Propose New Rule form fields
  const [propTitle, setPropTitle] = useState('');
  const [propDescription, setPropDescription] = useState('');
  const [propCategory, setPropCategory] = useState<RuleCategory>('interaction');
  const [propTier, setPropTier] = useState<'static' | 'runtime'>('static');
  const [propStandardRef, setPropStandardRef] = useState('');
  const [propThresholdIntent, setPropThresholdIntent] = useState('');

  // Copy feedback tracking
  const [copiedProposalId, setCopiedProposalId] = useState<string | null>(null);

  // Compute effective live rules
  const baseRulesWithOverrides = HMI_RULES.map((rule) => {
    if (rule.tier === 'manual' && editedBaseManualRules[rule.id]) {
      return { ...rule, ...editedBaseManualRules[rule.id] };
    }
    return rule;
  });

  const allLiveRules: HMIRule[] = [...baseRulesWithOverrides, ...userDefinedManualRules];

  // Filter rules
  const filteredRules = allLiveRules.filter((rule) => {
    if (selectedTierFilter !== 'all' && rule.tier !== selectedTierFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rule.title.toLowerCase().includes(q);
      const matchDesc = rule.description.toLowerCase().includes(q);
      const matchStd = rule.standardRef?.toLowerCase().includes(q);
      const matchId = rule.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchStd && !matchId) return false;
    }
    return true;
  });

  // Category toggle
  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Handlers for Add Manual Rule
  const handleSaveAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualDescription.trim() || !manualStandardRef.trim()) return;

    addUserDefinedManualRule({
      title: manualTitle.trim(),
      description: manualDescription.trim(),
      category: manualCategory,
      standardRef: manualStandardRef.trim(),
      source: 'user-proposed',
    });

    setManualTitle('');
    setManualDescription('');
    setManualStandardRef('');
    setIsAddManualOpen(false);
  };

  // Handlers for Edit Manual Rule
  const handleStartEdit = (rule: HMIRule) => {
    setEditingRuleId(rule.id);
    setEditTitle(rule.title);
    setEditDescription(rule.description);
    setEditCategory(rule.category);
    setEditStandardRef(rule.standardRef || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRuleId || !editTitle.trim() || !editDescription.trim() || !editStandardRef.trim()) return;

    updateManualRule(editingRuleId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      category: editCategory,
      standardRef: editStandardRef.trim(),
    });

    setEditingRuleId(null);
  };

  // Handlers for Propose New Rule
  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim() || !propDescription.trim() || !propStandardRef.trim() || !propThresholdIntent.trim()) return;

    addRuleProposal({
      title: propTitle.trim(),
      description: propDescription.trim(),
      category: propCategory,
      tier: propTier,
      standardRef: propStandardRef.trim(),
      thresholdIntent: propThresholdIntent.trim(),
    });

    setPropTitle('');
    setPropDescription('');
    setPropStandardRef('');
    setPropThresholdIntent('');
    setIsProposeOpen(false);
  };

  // Export proposal markdown to clipboard
  const handleExportProposal = (proposal: RuleProposal) => {
    const markdown = [
      `### HMI Rule Proposal: ${proposal.title}`,
      `- **ID / Key**: \`${proposal.id}\``,
      `- **Category**: ${proposal.category}`,
      `- **Tier**: ${proposal.tier}`,
      `- **Standard Reference**: ${proposal.standardRef}`,
      `- **Created At**: ${proposal.createdAt}`,
      `- **Description**:`,
      `  ${proposal.description}`,
      `- **Threshold & Pass/Fail Intent**:`,
      `  ${proposal.thresholdIntent}`,
    ].join('\n');

    navigator.clipboard.writeText(markdown).then(() => {
      updateRuleProposalStatus(proposal.id, 'exported');
      setCopiedProposalId(proposal.id);
      setTimeout(() => setCopiedProposalId(null), 2500);
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50 text-slate-100 font-sans overflow-hidden">
      {/* Registry Sub-header & Action Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {onBackToFindings && (
            <button
              type="button"
              id="mockpit-registry-back-btn"
              onClick={onBackToFindings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition-colors cursor-pointer mr-1"
              title="Back to Audit Findings"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Findings</span>
            </button>
          )}
          <BookOpen className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-200 uppercase tracking-wider">
            HMI Rule Registry & Standards
          </h3>
          <span className="text-xs font-mono text-slate-500">
            ({allLiveRules.length} active rules · {ruleProposals.length} proposals)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Manual Rule Button */}
          <button
            type="button"
            id="mockpit-add-manual-rule-btn"
            onClick={() => {
              setIsAddManualOpen(!isAddManualOpen);
              setIsProposeOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
              isAddManualOpen
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Add a manual review rule to the live registry"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Manual Rule</span>
          </button>

          {/* Propose Rule Button */}
          <button
            type="button"
            id="mockpit-propose-rule-btn"
            onClick={() => {
              setIsProposeOpen(!isProposeOpen);
              setIsAddManualOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
              isProposeOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-700/50'
            }`}
            title="Draft a proposal for a logic-backed rule"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Propose New Rule</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Tier filter chips */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Tier:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'static', label: 'Static' },
            { id: 'runtime', label: 'Runtime' },
            { id: 'manual', label: 'Manual' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => setSelectedTierFilter(chip.id)}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                selectedTierFilter === chip.id
                  ? 'bg-sky-500 text-slate-950 font-bold border-sky-400'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700/60'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search rules or standards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-64 bg-slate-950 border border-slate-700/70 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Inline Form: Add Manual Rule */}
      {isAddManualOpen && (
        <div className="p-4 mx-5 my-3 rounded-xl bg-slate-950/90 border border-sky-500/40 shadow-xl shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              <h4 className="text-xs font-bold font-mono uppercase text-sky-300">Add Manual Review Rule</h4>
            </div>
            <button
              onClick={() => setIsAddManualOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveAddManual} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tactile Confirmations for Touch Switches"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Category *</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as RuleCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Standard Reference *</label>
              <input
                type="text"
                required
                placeholder="e.g. ISO 15005 §5.2 / NHTSA Distraction Criterion 3"
                value={manualStandardRef}
                onChange={(e) => setManualStandardRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Description & Human Factors Verification Criteria *</label>
              <textarea
                required
                rows={2}
                placeholder="Explain what the reviewer should manually verify when inspecting the screen..."
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Tier is fixed to <strong className="text-amber-400">manual</strong> (evaluated as 'needs-review' during audits; participates immediately).
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddManualOpen(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer"
                >
                  Save Manual Rule
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Inline Form: Propose New Rule */}
      {isProposeOpen && (
        <div className="p-4 mx-5 my-3 rounded-xl bg-slate-950/90 border border-amber-500/40 shadow-xl shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold font-mono uppercase text-amber-300">
                Propose New Rule (Logic-Backed Draft)
              </h4>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                DRAFT
              </span>
            </div>
            <button
              onClick={() => setIsProposeOpen(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveProposal} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Rule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steering Wheel Control Mirroring"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Execution Tier *</label>
                <select
                  value={propTier}
                  onChange={(e) => setPropTier(e.target.value as 'static' | 'runtime')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="static">Static (Canvas & AST Check)</option>
                  <option value="runtime">Runtime (Interactive Latency)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Category *</label>
                <select
                  value={propCategory}
                  onChange={(e) => setPropCategory(e.target.value as RuleCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Standard Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAE J2364 / ISO 2575"
                  value={propStandardRef}
                  onChange={(e) => setPropStandardRef(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Rule Description *</label>
              <textarea
                required
                rows={2}
                placeholder="High-level description of what this rule ensures and why..."
                value={propDescription}
                onChange={(e) => setPropDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">
                Threshold & Pass/Fail Intent * (Plain-language criteria for future code implementation)
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Fails if adjacent button spacing is < 10px; warns if color contrast ratio < 4.5:1..."
                value={propThresholdIntent}
                onChange={(e) => setPropThresholdIntent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Proposals are saved as drafts and do <strong className="text-slate-300">not</strong> run during audits until implemented into executable code.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsProposeOpen(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  Save Proposal Draft
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Section: Proposed Rules (if any exist) */}
        {ruleProposals.length > 0 && (
          <div className="rounded-xl border border-dashed border-amber-500/50 bg-amber-950/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                  Proposed Rules (Drafts · Not Yet Active)
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">({ruleProposals.length})</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Use "Export" to copy structured prompt specifications for implementation.
              </p>
            </div>

            <div className="space-y-2.5">
              {ruleProposals.map((prop) => (
                <div
                  key={prop.id}
                  className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 text-xs font-mono space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                          Draft
                        </span>
                        <span className="text-slate-200 font-bold text-sm font-sans">{prop.title}</span>
                        <span className="text-[11px] text-slate-400 uppercase">
                          ({prop.category} · {prop.tier.toUpperCase()})
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed text-xs">{prop.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleExportProposal(prop)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer border ${
                          copiedProposalId === prop.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Copy Markdown specification for coding agent"
                      >
                        {copiedProposalId === prop.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" /> Export
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => deleteRuleProposal(prop.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete proposal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-slate-900/90 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="text-slate-400">
                      <span className="text-slate-500">Standard: </span>
                      <span className="text-sky-300">{prop.standardRef}</span>
                    </div>
                    <div className="text-slate-300 font-sans">
                      <strong className="text-amber-400 font-mono">Threshold Intent: </strong>
                      {prop.thresholdIntent}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Rules Grouped by Category */}
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const rulesInCategory = filteredRules.filter((r) => r.category === cat.id);
            if (rulesInCategory.length === 0) return null;

            const isCollapsed = collapsedCategories[cat.id];
            const CatIcon = cat.icon;

            return (
              <div
                key={cat.id}
                className="rounded-xl bg-slate-950/50 border border-slate-800/80 overflow-hidden shadow-sm"
              >
                {/* Category Group Header */}
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border-b border-slate-800/60 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <CatIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
                      {cat.label}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ({rulesInCategory.length})
                    </span>
                  </div>

                  <div className="text-slate-500">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Rules in Category */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-800/50">
                    {rulesInCategory.map((rule) => {
                      const isPreExisting = HMI_RULES.some((r) => r.id === rule.id);
                      const isUserAdded = !isPreExisting;
                      const isManual = rule.tier === 'manual';
                      const isEditingThis = editingRuleId === rule.id;

                      // Tier badge styling
                      const tierBadgeStyle =
                        rule.tier === 'static'
                          ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : rule.tier === 'runtime'
                          ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                      if (isEditingThis) {
                        return (
                          <div key={rule.id} className="p-4 bg-slate-900/90 space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                              <span className="text-xs font-bold font-mono text-sky-400 uppercase">
                                Edit Manual Rule ({rule.id})
                              </span>
                              <button
                                onClick={() => setEditingRuleId(null)}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs font-mono">
                              <div>
                                <label className="block text-slate-400 mb-1">Title</label>
                                <input
                                  type="text"
                                  required
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-sans"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-slate-400 mb-1">Category</label>
                                  <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value as RuleCategory)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                                  >
                                    {CATEGORIES.map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-slate-400 mb-1">Standard Reference</label>
                                  <input
                                    type="text"
                                    required
                                    value={editStandardRef}
                                    onChange={(e) => setEditStandardRef(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-slate-400 mb-1">Description</label>
                                <textarea
                                  required
                                  rows={2}
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-sans"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRuleId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="px-3 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold cursor-pointer"
                                >
                                  Save Changes
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={rule.id}
                          className="p-3.5 hover:bg-slate-900/40 transition-colors flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-100 text-sm font-sans">
                                {rule.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${tierBadgeStyle}`}
                              >
                                {rule.tier}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ({rule.id})
                              </span>
                              {isUserAdded && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                                  User Added
                                </span>
                              )}
                            </div>

                            <p className="text-slate-300 font-sans text-xs leading-relaxed">
                              {rule.description}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 flex-wrap pt-0.5">
                              <div>
                                <span className="text-slate-500 font-semibold">Standard: </span>
                                <span className="text-sky-300">{rule.standardRef || '—'}</span>
                              </div>
                              <span className="text-slate-600">·</span>
                              <div>
                                <span className="text-slate-500">Source: </span>
                                <span className="text-slate-300">{rule.source}</span>
                              </div>
                              {rule.addedDate && (
                                <>
                                  <span className="text-slate-600">·</span>
                                  <div>
                                    <span className="text-slate-500">Added: </span>
                                    <span className="text-slate-300">{rule.addedDate}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Actions: Edit only on manual rules; Delete only on user-added manual rules */}
                          <div className="flex items-center gap-1 shrink-0 pt-0.5">
                            {isManual && (
                              <button
                                type="button"
                                onClick={() => handleStartEdit(rule)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                                title={`Edit manual rule: ${rule.title}`}
                                aria-label={`Edit ${rule.title}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isUserAdded && isManual && (
                              <button
                                type="button"
                                onClick={() => deleteUserDefinedManualRule(rule.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                                title={`Delete user manual rule: ${rule.title}`}
                                aria-label={`Delete ${rule.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
