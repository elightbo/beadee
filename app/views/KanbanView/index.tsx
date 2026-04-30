import { useState } from 'react';
import { useIssues } from '../../hooks/api/useIssues.js';
import { useUpdateIssue } from '../../hooks/api/useUpdateIssue.js';
import { useToast } from '../../hooks/useToast.js';
import IssueCard from '../../components/IssueCard/index.jsx';
import type { DetailPanelComponent } from '../../components/DetailPanel/index.js';
import type { Issue } from '../../types.js';
import './KanbanView.css';

const COLUMNS = [
  { id: 'open', label: 'Open', status: 'open' },
  { id: 'in_progress', label: 'In Progress', status: 'in_progress' },
  { id: 'blocked', label: 'Blocked', status: 'blocked' },
  { id: 'done', label: 'Done', status: 'closed' },
];

interface KanbanColumnProps {
  column: (typeof COLUMNS)[number];
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  hidden: boolean;
  draggingId: string | null;
  dropTargetId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onEpicDragOver: (e: React.DragEvent, epicId: string) => void;
  onEpicDrop: (e: React.DragEvent, epicId: string) => void;
  onEpicDragLeave: (e: React.DragEvent, epicId: string) => void;
}

function KanbanColumn({
  column,
  issues,
  selectedIssueId,
  onSelectIssue,
  hidden,
  draggingId,
  dropTargetId,
  onDragStart,
  onDragEnd,
  onEpicDragOver,
  onEpicDrop,
  onEpicDragLeave,
}: KanbanColumnProps) {
  return (
    <div className={`kanban-col kanban-col-${column.id}${hidden ? ' kanban-col-hidden' : ''}`}>
      <div className="kanban-col-header">
        <span className="kanban-col-label">{column.label}</span>
        <span className="kanban-col-count">{issues.length}</span>
      </div>
      <div className="kanban-col-body">
        {issues.length === 0 && <div className="kanban-empty">No issues</div>}
        {issues.map((issue) => {
          const isEpic = issue.issue_type === 'epic';
          const isSelf = issue.id === draggingId;
          return (
            <IssueCard
              key={issue.id}
              issue={issue}
              selected={issue.id === selectedIssueId}
              onClick={() => onSelectIssue(issue.id === selectedIssueId ? null : issue.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDropTarget={isEpic && !isSelf && dropTargetId === issue.id}
              onDragOver={isEpic && !isSelf ? (e) => onEpicDragOver(e, issue.id) : undefined}
              onDrop={isEpic && !isSelf ? (e) => onEpicDrop(e, issue.id) : undefined}
              onDragLeave={isEpic && !isSelf ? (e) => onEpicDragLeave(e, issue.id) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}

interface KanbanViewProps {
  selectedIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
  DetailPanel: DetailPanelComponent;
  onRefreshed: (date: Date) => void;
}

export default function KanbanView({
  selectedIssueId,
  onSelectIssue,
  DetailPanel,
  onRefreshed,
}: KanbanViewProps) {
  const [activeColumn, setActiveColumn] = useState('open');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const { issues, loading, error } = useIssues({}, { onRefreshed });
  const updateIssue = useUpdateIssue();
  const { add: addToast } = useToast();

  const byStatus: Record<string, Issue[]> = {};
  for (const col of COLUMNS) byStatus[col.status] = [];
  for (const issue of issues) {
    if (byStatus[issue.status]) byStatus[issue.status].push(issue);
  }

  const issueMap = new Map(issues.map((i) => [i.id, i]));

  function handleDragStart(id: string) {
    setDraggingId(id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleEpicDragOver(e: React.DragEvent, epicId: string) {
    if (!draggingId || draggingId === epicId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetId(epicId);
  }

  function handleEpicDrop(e: React.DragEvent, epicId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === epicId) return;
    const epic = issueMap.get(epicId);
    updateIssue.mutate(
      { id: draggingId, data: { parent: epicId } },
      {
        onSuccess: () => {
          addToast({
            id: Date.now() + Math.random(),
            message: `Set parent to ${epic?.title ?? epicId}`,
            type: 'success',
          });
        },
        onError: () => {
          addToast({
            id: Date.now() + Math.random(),
            message: 'Failed to set parent',
            type: 'error',
          });
        },
      },
    );
    setDraggingId(null);
    setDropTargetId(null);
  }

  function handleEpicDragLeave(e: React.DragEvent, epicId: string) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDropTargetId((prev) => (prev === epicId ? null : prev));
  }

  return (
    <div className="kanban-view">
      <div className="kanban-col-picker">
        {COLUMNS.map((col) => (
          <button
            key={col.id}
            className={`pill ${activeColumn === col.id ? 'active' : ''}`}
            onClick={() => setActiveColumn(col.id)}
          >
            {col.label}
            {!loading && (byStatus[col.status]?.length ?? 0) > 0 && (
              <span className="kanban-picker-count">{byStatus[col.status].length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="kanban-board">
        {loading && <div className="kanban-state">Loading…</div>}
        {error && <div className="kanban-state kanban-error">Error: {error}</div>}
        {!loading &&
          !error &&
          COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              issues={byStatus[col.status]}
              selectedIssueId={selectedIssueId}
              onSelectIssue={onSelectIssue}
              hidden={activeColumn !== col.id}
              draggingId={draggingId}
              dropTargetId={dropTargetId}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onEpicDragOver={handleEpicDragOver}
              onEpicDrop={handleEpicDrop}
              onEpicDragLeave={handleEpicDragLeave}
            />
          ))}
      </div>

      {selectedIssueId && (
        <div className="kanban-detail">
          <DetailPanel issueId={selectedIssueId} onClose={() => onSelectIssue(null)} />
        </div>
      )}
    </div>
  );
}
