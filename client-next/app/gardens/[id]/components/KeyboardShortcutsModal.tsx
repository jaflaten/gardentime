'use client';

import React from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Cancel drawing / Deselect' },
      { keys: ['⌘/Ctrl', 'Z'], description: 'Undo' },
      { keys: ['⌘/Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['⌘/Ctrl', 'Y'], description: 'Redo (alternative)' },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      { keys: ['1'], description: 'Select Tool' },
      { keys: ['2'], description: 'Pan Tool' },
      { keys: ['3'], description: 'Rectangle Tool' },
      { keys: ['4'], description: 'Circle Tool' },
      { keys: ['5'], description: 'Line Tool' },
      { keys: ['6'], description: 'Arrow Tool' },
      { keys: ['7'], description: 'Text Tool' },
      { keys: ['8'], description: 'Freehand Tool' },
    ],
  },
  {
    title: 'Selection & Editing',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'C'], description: 'Copy selected object' },
      { keys: ['⌘/Ctrl', 'V'], description: 'Paste copied object' },
      { keys: ['⌘/Ctrl', 'D'], description: 'Duplicate selected object' },
      { keys: ['Delete'], description: 'Delete selected object' },
      { keys: ['Backspace'], description: 'Delete selected object (Mac)' },
      { keys: ['Shift', 'Click'], description: 'Multi-select objects' },
    ],
  },
  {
    title: 'Movement',
    shortcuts: [
      { keys: ['↑'], description: 'Move selected object up' },
      { keys: ['↓'], description: 'Move selected object down' },
      { keys: ['←'], description: 'Move selected object left' },
      { keys: ['→'], description: 'Move selected object right' },
      { keys: ['Shift', '↑↓←→'], description: 'Move selected object 10px' },
    ],
  },
  {
    title: 'View',
    shortcuts: [
      { keys: ['⌘/Ctrl', '0'], description: 'Fit to view' },
      { keys: ['⌘/Ctrl', '+'], description: 'Zoom in' },
      { keys: ['⌘/Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Space', 'Drag'], description: 'Pan canvas (when Select tool active)' },
    ],
  },
  {
    title: 'Drawing Modifiers',
    shortcuts: [
      { keys: ['Shift'], description: 'Constrain proportions (square/circle)' },
      { keys: ['Shift'], description: 'Snap angles to 45° (line/arrow)' },
    ],
  },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={shortcutIndex}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center gap-1 ml-4">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm whitespace-nowrap">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
