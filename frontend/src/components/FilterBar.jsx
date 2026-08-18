import React from 'react';
import { useBoardStore } from '../store/boardStore';
import { Filter, XCircle } from 'lucide-react';

const FilterBar = () => {
  const { activeBoard, filters, setFilter, clearFilters } = useBoardStore();

  const handleFilterChange = (key, value) => {
    setFilter(key, value);
  };

  const isFiltered = filters.priority !== 'all' || filters.assignee !== 'all' || filters.date !== 'all';

  return (
    <div className="filter-bar">
      <div className="filters-group">
        <span className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} style={{ color: 'var(--color-primary)' }} />
          Filters:
        </span>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => handleFilterChange('assignee', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {activeBoard?.members?.map((member) => (
            <option key={member._id} value={member._id}>
              Assigned to: {member.username}
            </option>
          ))}
        </select>

        {/* Due Date Filter */}
        <select
          value={filters.date}
          onChange={(e) => handleFilterChange('date', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="none">No Due Date</option>
        </select>

        {/* Clear Filters action */}
        {isFiltered && (
          <button onClick={clearFilters} className="clear-filters-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={14} />
            Clear
          </button>
        )}
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
        Realtime Collaboration Active
      </div>
    </div>
  );
};

export default FilterBar;
