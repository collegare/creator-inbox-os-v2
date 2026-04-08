import { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useData } from '../contexts';
import { PageHeader } from './Common';
import { PIPELINE_STAGES, parseRate, fmtCurrency, fmtDateShort } from '../utils';
import { GripVertical, DollarSign } from 'lucide-react';

export default function Pipeline() {
  const { opportunities, reorderOpps, updateOpp } = useData();

  /* Group opportunities by status */
  const columns = useMemo(() => {
    const map = {};
    PIPELINE_STAGES.forEach(s => { map[s.id] = []; });
    opportunities.forEach(o => {
      const key = o.status || 'new';
      if (map[key]) map[key].push(o);
      else map['new'].push(o);
    });
    return map;
  }, [opportunities]);

  /* Handle drag end */
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const opp = opportunities.find(o => o.id === draggableId);
    if (!opp) return;

    /* If moved to a different column, update status */
    if (source.droppableId !== destination.droppableId) {
      updateOpp(opp.id, { status: destination.droppableId });
    }

    /* Reorder within the full list — we update status above, so the column view updates automatically */
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Pipeline" subtitle="Drag and drop opportunities across stages." />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4" style={{ minHeight: '60vh' }}>
          {PIPELINE_STAGES.map(stage => (
            <Droppable key={stage.id} droppableId={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    flex-shrink-0 w-[260px] rounded-md p-3 transition-colors duration-200
                    ${snapshot.isDraggingOver ? 'bg-brand-primary-l' : 'bg-brand-surface-alt'}
                  `}
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-${stage.id}`}>{stage.label}</span>
                    </div>
                    <span className="text-xs font-medium text-brand-text-muted">{columns[stage.id].length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 min-h-[100px]">
                    {columns[stage.id].map((opp, idx) => (
                      <Draggable key={opp.id} draggableId={opp.id} index={idx}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={`
                              card p-3.5 cursor-grab active:cursor-grabbing
                              ${dragSnapshot.isDragging ? 'shadow-lg ring-2 ring-brand-primary/20' : ''}
                            `}
                          >
                            <div className="flex items-start gap-2">
                              <div {...dragProvided.dragHandleProps} className="mt-0.5 text-brand-text-muted hover:text-brand-text transition-colors">
                                <GripVertical size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-brand-text truncate">{opp.brand}</p>
                                {opp.contact && <p className="text-xs text-brand-text-muted truncate mt-0.5">{opp.contact}</p>}

                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                  <span className={`badge badge-${opp.type}`}>{opp.type}</span>
                                  <span className={`badge badge-${opp.priority}`}>{opp.priority}</span>
                                </div>

                                {opp.rate && (
                                  <div className="flex items-center gap-1 mt-2 text-xs text-brand-success font-medium">
                                    <DollarSign size={12} />
                                    {opp.rate}
                                  </div>
                                )}

                                {opp.followUpDate && (
                                  <p className="text-[11px] text-brand-text-muted mt-1.5">
                                    Follow-up: {fmtDateShort(opp.followUpDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>

                  {/* Column total */}
                  {columns[stage.id].length > 0 && (
                    <div className="mt-3 pt-2 border-t border-brand-border-l px-1 text-xs text-brand-text-muted flex justify-between">
                      <span>{columns[stage.id].length} deal{columns[stage.id].length !== 1 ? 's' : ''}</span>
                      <span className="font-medium">{fmtCurrency(columns[stage.id].reduce((s, o) => s + parseRate(o.rate), 0))}</span>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
