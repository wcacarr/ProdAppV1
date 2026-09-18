import React, { useMemo } from 'react';
import EditQuestSheet from './EditQuestSheet';
import TimeSlotSheet from './TimeSlotSheet';
import { useQuestStore } from '../state/store';
import { formatSlot, slotChoices } from '../state/schedule';

/**
 * The quest editor and the slot picker, mounted at the window root.
 *
 * These used to live inside TodayScreen, which put their absolute fill inside
 * the content pane rather than the window: they rendered as a small box in the
 * upper part of the screen, and Android delivered no touches to the parts drawn
 * outside that pane's bounds, so they looked interactive and were not.
 */
export default function QuestSheets() {
  const quests = useQuestStore((s) => s.quests);
  const dayWindow = useQuestStore((s) => s.dayWindow);

  const editingTimeId = useQuestStore((s) => s.editingTimeId);
  const closeTimeEditor = useQuestStore((s) => s.closeTimeEditor);
  const setQuestStart = useQuestStore((s) => s.setQuestStart);

  const editingQuestId = useQuestStore((s) => s.editingQuestId);

  const slots = useMemo(() => slotChoices(dayWindow), [dayWindow]);
  const timeQuest = quests.find((q) => q.id === editingTimeId) ?? null;
  const editQuest = quests.find((q) => q.id === editingQuestId) ?? null;

  return (
    <>
      {editQuest && <EditQuestSheet quest={editQuest} />}
      {timeQuest && (
        <TimeSlotSheet
          title={timeQuest.name}
          subtitle={`${timeQuest.mins} MIN · CURRENTLY ${formatSlot(timeQuest.startMin).toUpperCase()}`}
          value={timeQuest.startMin}
          slots={slots}
          onPick={(startMin) => setQuestStart(timeQuest.id, startMin)}
          onClose={closeTimeEditor}
        />
      )}
    </>
  );
}
