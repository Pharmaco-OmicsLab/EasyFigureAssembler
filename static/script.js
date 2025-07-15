// static/script.js

document.addEventListener('DOMContentLoaded', () => {
    // Ensure handleSettingChange is available immediately
    if (!window.handleSettingChange) {
        window.handleSettingChange = function(key, value) {
            console.warn('handleSettingChange called before initialization');
        };
    }
});

    // --- 1. GET ALL THE HTML ELEMENTS WE'LL NEED ---
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const figureCanvas = document.getElementById('figure-canvas');
    const ctx = figureCanvas.getContext('2d');

    // Sidebar Controls
    const labelStyleSelect = document.getElementById('label-style');
    const labelPositionSelect = document.getElementById('label-position');
    const labelFontFamilySelect = document.getElementById('label-font-family');
    const labelFontSizeInput = document.getElementById('label-font-size');
    const labelFontWeightSelect = document.getElementById('label-font-weight');
    const journalSelect = document.getElementById('journal-select');
    const layoutOptionsContainer = document.getElementById('layout-options');
    const feedbackList = document.getElementById('feedback-list');
    const targetWidthInput = document.getElementById('target-width-input');
    const applyDimensionBtn = document.getElementById('apply-dimension-btn');
    const customLabelsContainer = document.getElementById('custom-labels');
    const exportDpiSelect = document.getElementById('export-dpi-select');
    const exportDpiCustom = document.getElementById('export-dpi-custom');
    const individualExportContainer = document.getElementById('individual-export-container');

    // New export functionality elements
    const exportFigureBtn = document.getElementById('export-figure-btn');
    const exportOptionCards = document.querySelectorAll('.export-option-card');

    // New label spacing elements
    const labelSpacingNumber = document.getElementById('label-spacing-number');
    const labelSpacingDecrease = document.getElementById('label-spacing-decrease');
    const labelSpacingIncrease = document.getElementById('label-spacing-increase');
    const labelSpacingValue = document.getElementById('label-spacing-value');

    // Panel Spacing Controls
    const spacingSlider = document.getElementById('spacing-slider');
    const spacingNumber = document.getElementById('spacing-number');
    const spacingDecrease = document.getElementById('spacing-decrease');
    const spacingIncrease = document.getElementById('spacing-increase');
    const spacingReset = document.getElementById('spacing-reset');
    const spacingPreview = document.querySelector('.spacing-preview-inline');
    const spacingPresets = document.querySelectorAll('.preset-btn');
    const spacingCurrentDisplay = document.getElementById('spacing-current-display');

    // Global Action Buttons
    const saveProjectBtn = document.getElementById('save-project-btn');
    const loadProjectInput = document.getElementById('load-project-input');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const figureTabsContainer = document.getElementById('figure-tabs');
    const addFigureBtn = document.getElementById('add-figure-btn');
    const addPanelsBtn = document.getElementById('add-panels-btn');

    // Flag to prevent saving state during undo/redo operations
    let isRestoringState = false;
    window.isRestoringState = false;

    // Panel Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editCanvas = document.getElementById('edit-canvas');
    const editCtx = editCanvas.getContext('2d');
    const brightnessSlider = document.getElementById('brightness-slider');
    const brightnessValue = document.getElementById('brightness-value');
    const contrastSlider = document.getElementById('contrast-slider');
    const contrastValue = document.getElementById('contrast-value');
    const rotateSlider = document.getElementById('rotate-slider');
    const rotateValue = document.getElementById('rotate-value');
    const resetCropBtn = document.getElementById('reset-crop-btn'); // Move reset crop button here.
    const resetBrightnessBtn = document.getElementById('reset-brightness-btn');
    const resetContrastBtn = document.getElementById('reset-contrast-btn');
    const resetRotateBtn = document.getElementById('reset-rotate-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const applyEditBtn = document.getElementById('apply-edit-btn');
    const greyscaleBtn = document.getElementById('greyscale-btn');
    const panelColspanInput = document.getElementById('panel-colspan-input');
    const panelRowspanInput = document.getElementById('panel-rowspan-input');

    // Main canvas controls
    const maintainAspectRatioCheckbox = document.getElementById('maintain-aspect-ratio');

    // Annotation Elements
    const annotationTools = document.getElementById('annotation-tools');
    const annotationColorInput = document.getElementById('annotation-color');
    const annotationLineWidthInput = document.getElementById('annotation-linewidth');
    const annotationFontSizeInput = document.getElementById('annotation-fontsize');
    // NEW: Text annotation specific controls
    const annotationFontFamilySelect = document.getElementById('annotation-font-family'); //
    const annotationBoldBtn = document.getElementById('annotation-bold-btn'); // Assuming these are added in HTML
    const annotationItalicBtn = document.getElementById('annotation-italic-btn'); // Assuming these are added in HTML
    const annotationStylingOptions = document.querySelector('.annotation-options'); // Select the div that contains styling options
    const clearAnnotationsBtn = document.getElementById('clear-annotations-btn');

    // NEW: Panel list and context menu elements
    const panelListContainer = document.getElementById('panel-list-container-main');
    const panelContextMenu = document.getElementById('panel-context-menu');
    const figureCaptionEditor = document.getElementById('figure-caption-editor');
    const fitToPageBtn = document.getElementById('fit-to-page-btn');

    // NEW: Annotation history elements
    const undoAnnotationBtn = document.getElementById('undo-annotation-btn');
    const redoAnnotationBtn = document.getElementById('redo-annotation-btn');

    // NEW: Container size control elements
    const containerSizeSelect = document.getElementById('container-size-select');
    const customSizeControls = document.getElementById('custom-size-controls');
    const customWidthInput = document.getElementById('custom-width-input');
    const customHeightInput = document.getElementById('custom-height-input');
    const applyCustomSizeBtn = document.getElementById('apply-custom-size-btn');


    // --- 2. GLOBAL STATE MANAGEMENT ---
    let project = {};
    let activeFigureIndex = -1;
    let allJournalRules = {};

    const PIXELS_PER_MM = 3.78;
    const INCHES_PER_MM = 0.0393701;
    const PT_TO_PX = 1.33;

    // NEW: Minimum canvas width to maintain visual consistency across journals
    const MIN_CANVAS_WIDTH_MM = 80; // Minimum reasonable width for visual display
    const JOURNAL_SCALE_FACTOR = 1.2; // Scale factor to make narrow journals more readable

    let isDragging = false;
    let draggedPanel = null;
    let dragStartX = 0;
    let dragStartY = 0;

    let historyStack = [];
    let redoStack = [];

    // Edit Modal State
    let isEditModalOpen = false;
    let currentlyEditingPanel = null;
    let editImage = new Image();
    let cropBox = null;
    let isCropping = false;
    // NEW: Cropping interaction modes
    let cropInteractionMode = null; // 'new-crop', 'move', 'nw-resize', etc.
    let cropStartPos = null; // Mouse position when crop interaction started
    let cropStartBox = null; // Initial cropBox state when resize/move started

    // Annotation State
    let activeAnnotationTool = 'crop'; // Default to crop
    let isDrawingAnnotation = false;
    let currentAnnotation = null;
    let selectedAnnotation = null; // Index of the currently selected annotation
    let isDraggingAnnotation = false; // Whether an existing annotation is being dragged
    let annotationDragStart = null; // Mouse position when annotation drag started
    // NOTE: isResizingAnnotation is not defined in the provided code, removed as not used.

    // Zoom State (for main canvas)
    let currentZoom = 1.0;
    window.currentZoom = currentZoom;
    const ZOOM_STEP = 0.1;
    const MAX_ZOOM = 3.0;
    const MIN_ZOOM = 0.5;

    // Container Size State
    let containerSizeMode = 'auto'; // 'auto', 'small', 'medium', 'large', 'custom'
    let customContainerWidth = 800;
    let customContainerHeight = 600;
    let isZooming = false; // Flag to track zoom operations

    // Mini preview elements
    const miniPreviewCanvas = document.getElementById('mini-preview-canvas');
    const miniPreviewCtx = miniPreviewCanvas ? miniPreviewCanvas.getContext('2d') : null;

    // Sidebar preview elements (renamed from sticky)
    const sidebarPreviewContainer = document.getElementById('sidebar-preview-container') || document.getElementById('mini-preview-sticky');
    const sidebarPreviewCanvas = document.getElementById('mini-preview-sticky-canvas');
    const sidebarPreviewCtx = sidebarPreviewCanvas ? sidebarPreviewCanvas.getContext('2d') : null;
    const previewToggleBtn = document.getElementById('preview-toggle-btn');

    // Edit modal preview elements
    const editModalPreview = document.getElementById('edit-modal-preview');
    const editModalMiniPreviewCanvas = document.getElementById('edit-modal-mini-preview-canvas');
    const editModalMiniPreviewCtx = editModalMiniPreviewCanvas ? editModalMiniPreviewCanvas.getContext('2d') : null;
    const editPreviewToggleBtn = document.getElementById('edit-preview-toggle-btn');
    let isEditPreviewDragging = false;
    let editPreviewDragOffset = { x: 0, y: 0 };

    // NEW: Annotation history state (for modal-specific undo/redo)
    let annotationHistoryStack = [];
    let annotationRedoStack = [];

    // NEW: Panel list drag state
    let draggedPanelIndex = null;
    let contextMenuTargetPanel = null;

    // Export format selection state
    let selectedExportFormat = null;

    // Add mouse wheel scrolling support for edit controls
    function addEditControlsScrollSupport() {
        const editControls = document.getElementById('edit-controls-panel');
        if (editControls) {
            // Force scrollbar to be visible
            editControls.style.overflowY = 'scroll';
            editControls.style.overflowX = 'hidden';

            editControls.addEventListener('wheel', function(e) {
                e.preventDefault();
                const scrollAmount = e.deltaY;
                editControls.scrollTop += scrollAmount;
            }, { passive: false });
        }
    }

    // Feedback modal elements and state
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackCloseBtn = document.getElementById('feedback-close-btn');
    const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
    const feedbackText = document.getElementById('feedback-text');
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    let selectedRating = null;

    // Smart Layout loading modal elements
    const smartLayoutLoadingModal = document.getElementById('smart-layout-loading-modal');

    // Grid control elements
    const showGridCheckbox = document.getElementById('show-grid-checkbox');
    const showPanelGridCheckbox = document.getElementById('show-panel-grid-checkbox');
    const showLabelGridCheckbox = document.getElementById('show-label-grid-checkbox');
    const gridColorInput = document.getElementById('grid-color-input');
    const gridTypeSelect = document.getElementById('grid-type-select');
    const gridThicknessInput = document.getElementById('grid-thickness-input');

    // Canvas Pan State (for main canvas)
    let canvasPanX = 0;
    let canvasPanY = 0;
    window.canvasPanX = canvasPanX;
    window.canvasPanY = canvasPanY;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;

    // Custom Layout State
    let isPanelDraggingCustom = false;
    let isPanelResizingCustom = false;
    let selectedPanelCustom = null;
    let activeResizeHandleType = null;
    let dragStartPanelX = 0;
    let dragStartPanelY = 0;
    let dragStartMouseX = 0;
    let dragStartMouseY = 0;
    let resizeStartPanelBounds = null;
    const SNAP_GRID_SIZE = 10;
    const SNAP_TOLERANCE = 8;

    // --- 4. FILE UPLOAD LOGIC ---
    function handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') || 
            file.name.toLowerCase().endsWith('.tiff') || 
            file.name.toLowerCase().endsWith('.tif') ||
            file.name.toLowerCase().endsWith('.svg')
        );
        if (imageFiles.length === 0) return;
        if (activeFigureIndex === -1) {
            alert("Please add a figure first before uploading panels.");
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        if(activeFigure.panels.length > 0 && !confirm("This will replace all existing panels for the current figure. Continue?")) {
            return;
        }
        activeFigure.panels = [];

        const promises = imageFiles.map((file, index) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                const processDataUrl = (dataUrl, fileType) => {
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            id: 'panel_' + Date.now() + "_" + index,
                            image: img,
                            originalWidth: img.width, originalHeight: img.height,
                            x: 0, y: 0, displayWidth: 0, displayHeight: 0,
                            order: index, label: String.fromCharCode(65 + index),
                            originalSrc: dataUrl, originalFileType: fileType,
                            pristineSrc: dataUrl,
                            edits: {
                                crop: null, brightness: 100, contrast: 100, greyscale: 0, rotation: 0,
                                annotations: [],
                                layoutSpan: { colspan: 1, rowspan: 1 }
                            },
                            // Custom layout properties
                            customX: index * 220,
                            customY: index * 220,
                            customWidth: 200,
                            customHeight: 200
                        });
                    };
                    img.onerror = () => reject(`Could not load image data for ${file.name}.`);
                    img.src = dataUrl;
                };

                if (file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif')) {
                    reader.readAsArrayBuffer(file);
                    reader.onload = (e) => {
                        try {
                            const tiff = new Tiff({ buffer: e.target.result });
                            processDataUrl(tiff.toCanvas().toDataURL(), 'image/png');
                        } catch (err) { reject(`Could not decode TIFF file: ${file.name}.`); }
                    };
                } else if (file.name.toLowerCase().endsWith('.svg')) {
                    reader.readAsText(file);
                    reader.onload = (e) => {
                        if (e.target.result) {
                            // Create a blob URL for SVG content
                            const blob = new Blob([e.target.result], { type: 'image/svg+xml' });
                            const svgUrl = URL.createObjectURL(blob);
                            processDataUrl(svgUrl, 'image/svg+xml');
                        } else {
                            reject(`Could not read SVG file ${file.name}: Empty result`);
                        }
                    };
                } else {
                    reader.readAsDataURL(file);
                    reader.onload = (e) => {
                        if (e.target.result) {
                            processDataUrl(e.target.result, file.type || 'image/png');
                        } else {
                            reject(`Could not read file ${file.name}: Empty result`);
                        }
                    };
                }
                reader.onerror = (err) => {
                    console.error(`File reading error for ${file.name}:`, err);
                    reject(`Could not read file ${file.name}: File reading failed`);
                };
            });
        });

        Promise.all(promises).then(async (panels) => {
            activeFigure.panels = panels;

            // Check if Smart Layout is active for initial uploads
            if (activeFigure.settings.layout === 'auto') {
                // Show loading dialog for Smart Layout
                showSmartLayoutLoadingDialog();

                // Update auxiliary UI first
                updateAuxiliaryUI();

                // Add delay for Smart Layout computation
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Update state and render
                renderFigure();

                // --- FIX: Ensure container is sized correctly after loading panels ---
                if (containerSizeMode === 'auto') {
                    setContainerSize('auto');
                }

                // Hide loading dialog
                hideSmartLayoutLoadingDialog();

                // Initialize history with the first state (panels just loaded)
                historyStack = [getCurrentState()];
                redoStack = [];
                updateHistoryButtons();
            } else {
                // For non-Smart Layout, proceed normally
                updateAuxiliaryUI();
                renderFigure();

                // Initialize history with the first state (panels just loaded)
                historyStack = [getCurrentState()];
                redoStack = [];
                updateHistoryButtons();
            }
        }).catch(error => {
            console.error("Error processing files:", error);
            hideSmartLayoutLoadingDialog(); // Ensure dialog is hidden on error
            alert("Error: " + error);
        });
    }

    // --- 4. LAYOUT ALGORITHMS ---
    function layoutVerticalStack(panels, options) {
        let currentY = options.spacing;
        const labelWidth = options.labelWidth || 0;
        const labelHeight = options.labelHeight || 0;
        const labelSpacing = options.labelSpacing || 0;

        panels.forEach(panel => {
            // Calculate frame dimensions first
            let frameWidth = panel.displayWidth;
            let frameHeight = panel.displayHeight;

            if (options.labelPosition === 'left') {
                frameWidth += labelWidth + labelSpacing;
            } else if (options.labelPosition === 'top') {
                frameHeight += labelHeight + labelSpacing;
            }

            // Define frame position and dimensions
            panel.frameX = options.spacing;
            panel.frameY = currentY;
            panel.frameWidth = frameWidth;
            panel.frameHeight = frameHeight;

            // Calculate image area within frame
            if (options.labelPosition === 'left') {
                panel.imageAreaX = panel.frameX + labelWidth + labelSpacing;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.frameWidth - (labelWidth + labelSpacing);
                panel.imageAreaHeight = panel.frameHeight;
            } else if (options.labelPosition === 'top') {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY + labelHeight + labelSpacing;
                panel.imageAreaWidth = panel.frameWidth;
                panel.imageAreaHeight = panel.frameHeight - (labelHeight + labelSpacing);
            } else {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.frameWidth;
                panel.imageAreaHeight = panel.frameHeight;
            }

            // Scale image using object-fit: contain logic
            const scaleX = panel.imageAreaWidth / panel.originalWidth;
            const scaleY = panel.imageAreaHeight / panel.originalHeight;
            const scale = Math.min(scaleX, scaleY);

            panel.displayWidth = panel.originalWidth * scale;
            panel.displayHeight = panel.originalHeight * scale;

            // Center image within its area
            panel.imageX = panel.imageAreaX + (panel.imageAreaWidth - panel.displayWidth) / 2;
            panel.imageY = panel.imageAreaY + (panel.imageAreaHeight - panel.displayHeight) / 2;

            // Position label at top-left of frame
            if (options.labelPosition === 'left') {
                panel.labelX = panel.imageAreaX - labelWidth - labelSpacing;
                panel.labelY = panel.imageAreaY;
            } else if (options.labelPosition === 'top') {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY;
            } else {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY - 20; // Position label above panel
            }

            // Move to next frame position
            currentY += frameHeight + options.spacing;
        });

        // Calculate total width based on frame width
        const totalFrameWidth = panels.length > 0 ? panels[0].frameWidth : 0;
        const totalWidth = totalFrameWidth + (2 * options.spacing);

        return { width: totalWidth, height: currentY };
    }

    function layoutSpanningGrid(panels, numCols, options) {

        if (panels.length === 0) return { width: 0, height: 0 };

        const gridMap = []; // 2D array to track occupied cells
        let maxRow = 0;
        const labelWidth = options.labelWidth || 0;
        const labelHeight = options.labelHeight || 0;
        const labelSpacing = options.labelSpacing || 0;

        // Calculate frame width for each column
        let frameWidthPerCol = (options.baseCanvasWidth - (options.spacing * (numCols + 1))) / numCols;

        // Place panels in grid
        panels.forEach(panel => {
            const span = panel.edits.layoutSpan || { colspan: 1, rowspan: 1 };
            const colspan = Math.max(1, Math.min(span.colspan || 1, numCols));
            const rowspan = Math.max(1, span.rowspan || 1);


            let placed = false;
            let r = 0, c = 0;

            // Find the next available empty cell
            while (!placed) {
                if (!gridMap[r]) gridMap[r] = [];
                if (!gridMap[r][c]) {
                    // Check if the panel can fit here without overlapping
                    let canFit = true;
                    for (let i = 0; i < rowspan && canFit; i++) {
                        for (let j = 0; j < colspan && canFit; j++) {
                            if (c + j >= numCols) { 
                                canFit = false; 
                                break; 
                            }
                            if (!gridMap[r + i]) gridMap[r + i] = [];
                            if (gridMap[r + i][c + j]) {
                                canFit = false; 
                                break;
                            }
                        }
                    }

                    if (canFit) {
                        // Place the panel and mark cells as occupied
                        panel.gridPos = { r, c, colspan, rowspan };

                        for (let i = 0; i < rowspan; i++) {
                            if (!gridMap[r + i]) gridMap[r + i] = [];
                            for (let j = 0; j < colspan; j++) {
                                gridMap[r + i][c + j] = panel.id;
                            }
                        }
                        maxRow = Math.max(maxRow, r + rowspan);
                        placed = true;
                    }
                }
                // Move to next cell
                c++;
                if (c >= numCols) { c = 0; r++; }

                // Safety check to prevent infinite loop
                if (r > 100) {
                    console.error('Grid placement failed for panel', panel.id);
                    panel.gridPos = { r: 0, c: 0, colspan: 1, rowspan: 1 };
                    placed = true;
                }
            }
        });

        // Calculate theoretical row heights first
        const rowHeights = new Array(maxRow).fill(0);
        panels.forEach(panel => {
            if (!panel.gridPos) return;

            const { r, colspan, rowspan } = panel.gridPos;

            // Calculate spanned frame dimensions
            const spannedFrameWidth = (frameWidthPerCol * colspan) + (options.spacing * (colspan - 1));

            // Calculate image area within spanned frame
            let imageAreaWidth = spannedFrameWidth;
            let imageAreaHeight = Infinity; // Will be constrained later

            if (options.labelPosition === 'left') {
                imageAreaWidth = spannedFrameWidth - labelWidth - labelSpacing;
            }

            // Scale image using object-fit: contain logic
            const scaleX = imageAreaWidth / panel.originalWidth;
            const scaleY = imageAreaHeight !== Infinity ? imageAreaHeight / panel.originalHeight : scaleX;
            const scale = Math.min(scaleX, scaleY);

            panel.displayWidth = panel.originalWidth * scale;
            panel.displayHeight = panel.originalHeight * scale;

            // Calculate total frame height (image + label area)
            let theoreticalFrameHeight = panel.displayHeight;
            if (options.labelPosition === 'top') {
                theoreticalFrameHeight += labelHeight + labelSpacing;
            }

            // Distribute frame height across spanned rows
            const heightPerSpannedRow = theoreticalFrameHeight / rowspan;
            for (let i = 0; i < rowspan; i++) {
                if (r + i < rowHeights.length) {
                    rowHeights[r + i] = Math.max(rowHeights[r + i], heightPerSpannedRow);
                }
            }
        });

        // Calculate final row positions
        let totalHeight = options.spacing;
        const rowYPositions = [options.spacing];
        rowHeights.forEach(h => {
            totalHeight += h + options.spacing;
            rowYPositions.push(totalHeight);
        });

        // Position panels with frame-based logic
        panels.forEach(panel => {
            if (!panel.gridPos) return;

            const { r, c, colspan, rowspan } = panel.gridPos;

            // Define frame boundaries
            panel.frameX = options.spacing + c * (frameWidthPerCol + options.spacing);
            panel.frameY = rowYPositions[r];
            panel.frameWidth = (frameWidthPerCol * colspan) + (options.spacing * (colspan - 1));
            panel.frameHeight = (rowYPositions[r + rowspan] || rowYPositions[rowYPositions.length - 1]) - panel.frameY - options.spacing;

            // Calculate image area within frame
            if (options.labelPosition === 'left') {
                panel.imageAreaX = panel.frameX + labelWidth + labelSpacing;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.frameWidth - (labelWidth + labelSpacing);
                panel.imageAreaHeight = panel.frameHeight;
            } else if (options.labelPosition === 'top') {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY + labelHeight + labelSpacing;
                panel.imageAreaWidth = panel.frameWidth;
                panel.imageAreaHeight = panel.frameHeight - (labelHeight + labelSpacing);
            } else {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.frameWidth;
                panel.imageAreaHeight = panel.frameHeight;
            }

            // Re-scale image to fit final image area using object-fit: contain
            const scaleX = panel.imageAreaWidth / panel.originalWidth;
            const scaleY = panel.imageAreaHeight / panel.originalHeight;
            const finalScale = Math.min(scaleX, scaleY);

            panel.displayWidth = panel.originalWidth * finalScale;
            panel.displayHeight = panel.originalHeight * finalScale;

            // Center image within its area
            panel.imageX = panel.imageAreaX + (panel.imageAreaWidth - panel.displayWidth) / 2;
            panel.imageY = panel.imageAreaY + (panel.imageAreaHeight - panel.displayHeight) / 2;


            // Position label at top-left of frame
            if (options.labelPosition === 'left') {
                panel.labelX = panel.imageAreaX - labelWidth - labelSpacing;
                panel.labelY = panel.imageAreaY;
            } else if (options.labelPosition === 'top') {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY;
            } else {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY - 20; // Position label above panel
            }
        });

        return { width: options.baseCanvasWidth, height: totalHeight };
    }

    function layoutCustom(panels, options) {
        if (panels.length === 0) return { width: 800, height: 600 };

        const labelWidth = options.labelWidth || 0;
        const labelHeight = options.labelHeight || 0;
        const labelSpacing = options.labelSpacing || 0;

        // Initialize custom properties for new panels
        panels.forEach((panel, index) => {
            if (panel.customX === undefined || panel.customY === undefined) {
                panel.customX = index * 220;
                panel.customY = index * 220;
            }
            if (panel.customWidth === undefined || panel.customHeight === undefined) {
                const aspectRatio = panel.originalWidth / panel.originalHeight;
                panel.customWidth = 200;
                panel.customHeight = 200 / aspectRatio;
            }

            // Define frame using custom coordinates (frame includes label area)
            panel.frameX = panel.customX;
            panel.frameY = panel.customY;

            // Calculate frame dimensions to include label area
            if (options.labelPosition === 'left') {
                panel.frameWidth = panel.customWidth + labelWidth + labelSpacing;
                panel.frameHeight = panel.customHeight;
            } else if (options.labelPosition === 'top') {
                panel.frameWidth = panel.customWidth;
                panel.frameHeight = panel.customHeight + labelHeight + labelSpacing;
            } else {
                panel.frameWidth = panel.customWidth;
                panel.frameHeight = panel.customHeight;
            }

            // Calculate image area within frame
            if (options.labelPosition === 'left') {
                panel.imageAreaX = panel.frameX + labelWidth + labelSpacing;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.customWidth;
                panel.imageAreaHeight = panel.customHeight;
            } else if (options.labelPosition === 'top') {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY + labelHeight + labelSpacing;
                panel.imageAreaWidth = panel.customWidth;
                panel.imageAreaHeight = panel.customHeight;
            } else {
                panel.imageAreaX = panel.frameX;
                panel.imageAreaY = panel.frameY;
                panel.imageAreaWidth = panel.customWidth;
                panel.imageAreaHeight = panel.customHeight;
            }

            // Scale image using object-fit: contain logic
            const scaleX = panel.imageAreaWidth / panel.originalWidth;
            const scaleY = panel.imageAreaHeight / panel.originalHeight;
            const scale = Math.min(scaleX, scaleY);

            panel.displayWidth = panel.originalWidth * scale;
            panel.displayHeight = panel.originalHeight * scale;

            // Center image within its area
            panel.imageX = panel.imageAreaX + (panel.imageAreaWidth - panel.displayWidth) / 2;
            panel.imageY = panel.imageAreaY + (panel.imageAreaHeight - panel.displayHeight) / 2;

            // Position label at top-left of frame
            if (options.labelPosition === 'left') {
                panel.labelX = panel.imageAreaX - labelWidth - labelSpacing;
                panel.labelY = panel.imageAreaY;
            } else if (options.labelPosition === 'top') {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY;
            } else {
                panel.labelX = panel.frameX;
                panel.labelY = panel.frameY - 20; // Position label above panel
            }
        });

        // Calculate canvas dimensions based on frame boundaries
        let maxX = 800;
        let maxY = 600;
        panels.forEach(panel => {
            maxX = Math.max(maxX, panel.frameX + panel.frameWidth + 50);
            maxY = Math.max(maxY, panel.frameY + panel.frameHeight + 50);
        });

        return { width: maxX, height: maxY };
    }

    // Add this new function for layout preference scoring
    function getLayoutPreferenceScore(layoutType, numCols, panelCount, canvasWidth) {
        let score = 0;

        // Base preferences for common panel counts
        if (panelCount === 1) {
            if (layoutType === 'stack') score += 100;
            if (layoutType === 'grid2x2' || layoutType === 'grid3x3' || layoutType === 'grid4xn') score -= 50; // Penalize wider grids for single panel
        } else if (panelCount === 2) {
            if (layoutType === 'stack') score += 80;
            if (layoutType === 'grid2x2' && numCols === 2) score += 90; // Strongly prefer 2 columns for 2 panels
            if (layoutType === 'grid3x3' || layoutType === 'grid4xn') score -= 40; // Penalize wider grids
        } else if (panelCount === 3) {
            if (layoutType === 'stack') score += 70;
            if (layoutType === 'grid3x3' && numCols === 3) score += 95; // Strongly prefer 3 columns for 3 panels
            if (layoutType === 'grid2x2') score += 60; // 2x2 with one below is okay
            if (layoutType === 'grid4xn') score -= 30;
        } else if (panelCount === 4) {
            if (layoutType === 'grid2x2' && numCols === 2) score += 100; // Optimal for 4 panels
            if (layoutType === 'grid4xn' && numCols === 4) score += 80; // Good for 4 panels
            if (layoutType === 'stack') score += 50;
            if (layoutType === 'grid3x3') score -= 10; // Less ideal for 4 panels
        } else if (panelCount >= 5 && panelCount <= 6) {
            if (layoutType === 'grid3x3' && numCols === 3) score += 90; // Good for 5-6 panels
            if (layoutType === 'grid2x2' && numCols === 2) score += 70;
            if (layoutType === 'grid4xn' && numCols === 4) score += 50;
        } else if (panelCount >= 7 && panelCount <= 9) {
            if (layoutType === 'grid3x3' && numCols === 3) score += 80;
            if (layoutType === 'grid4xn' && numCols === 4) score += 90; // Often better for more panels
        } else if (panelCount > 9) {
            if (layoutType === 'grid4xn' && numCols === 4) score += 100; // Best for many panels
            if (layoutType === 'grid3x3' && numCols === 3) score += 70;
        }

        // Penalize layouts that are too wide or too tall
        // These values are based on an ideal aesthetic, adjust as needed.
        const aspectRatio = canvasWidth / 800; // Assuming ~800px is a reference width for visual comparison
        if (numCols > panelCount && panelCount > 1) { // Penalize excessively wide grids for few panels
            score -= (numCols - panelCount) * 10;
        }

        return score;
    }

    // Helper function to assign intelligent spans based on panel aspect ratios
    function assignIntelligentSpans(panels, numCols) {
        if (numCols <= 1) return; // No spanning for single column layouts

        // Reset all spans to default first
        panels.forEach(panel => {
            panel.edits.layoutSpan = { colspan: 1, rowspan: 1 };
        });

        // Only apply intelligent spanning for layouts with more panels where it makes sense
        // For 4 panels or fewer, keep clean grid layout without spanning
        if (panels.length <= 4) {
            return; // No spanning for 4 panels or fewer
        }

        // Apply intelligent spanning only for 5+ panels
        panels.forEach((panel, index) => {
            const aspectRatio = panel.originalWidth / panel.originalHeight;

            // For the first panel (Panel A), make it 2x2 if we have enough columns and panels
            if (index === 0 && numCols >= 2 && panels.length >= 5) {
                panel.edits.layoutSpan = { colspan: 2, rowspan: 2 };
            }
            // For wide panels (aspect ratio > 1.8), span 2 columns if possible
            else if (aspectRatio > 1.8 && numCols >= 2) {
                panel.edits.layoutSpan = { colspan: Math.min(2, numCols), rowspan: 1 };
            }
            // For very tall panels (aspect ratio < 0.6), span 2 rows if it's a grid layout
            else if (aspectRatio < 0.6 && numCols >= 2) {
                panel.edits.layoutSpan = { colspan: 1, rowspan: 2 };
            }
            // Default case remains 1x1
        });
    }

    async function selectSmartLayout(panels, settings, journalRules) {
        if (!panels || panels.length === 0) {
            return { panels: [], effectiveLayout: 'stack' };
        }

        // Define candidate numCols values to test
        const candidateNumCols = [1, 2, 3, 4];
        const candidateLayouts = [];

        // Prepare layout options similar to renderFigure
        const spacing = parseInt(settings.spacing);
        const font = `${settings.labelFontWeight} ${settings.labelFontSize * PT_TO_PX}px ${settings.labelFontFamily}`;

        // Create temporary context for text metrics
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = font;
        const textMetrics = tempCtx.measureText('A');
        const labelHeight = (textMetrics.fontBoundingBoxAscent || (settings.labelFontSize * PT_TO_PX)) * 1.2;
        const labelWidth = textMetrics.width * 2;

        const layoutOptions = {
            spacing: spacing,
            labelPosition: settings.labelPosition,
            labelWidth: labelWidth,
            labelHeight: labelHeight,
            maintainAspectRatio: settings.maintainAspectRatio
        };

        // Calculate canvas width with improved logic for visual consistency
        let baseCanvasWidthMM = settings.targetWidth !== null ? settings.targetWidth : journalRules.doubleColumnWidth_mm;

        // Apply minimum width constraint and scaling for narrow journals
        if (settings.targetWidth === null) { // Only apply to journal-preset widths, not custom widths
            if (baseCanvasWidthMM < MIN_CANVAS_WIDTH_MM) {
                // For very narrow journals like Science, scale up for better visual experience
                baseCanvasWidthMM = Math.max(MIN_CANVAS_WIDTH_MM, baseCanvasWidthMM * JOURNAL_SCALE_FACTOR);
            }
        }

        const baseCanvasWidthPx = baseCanvasWidthMM * PIXELS_PER_MM;

        // Simulate layouts and collect metrics
        for (const numCols of candidateNumCols) {
            // Create deep copy of panels for simulation
            const panelsCopyForSimulation = JSON.parse(JSON.stringify(panels));

            // Restore image references (JSON.stringify loses them)
            panelsCopyForSimulation.forEach((panel, index) => {
                panel.image = panels[index].image;
            });

            // Determine effective layout type
            let effectiveLayoutType;
            if (numCols === 1) {
                effectiveLayoutType = 'stack';
            } else if (numCols === 2) {
                effectiveLayoutType = 'grid2x2';
            } else if (numCols === 3) {
                effectiveLayoutType = 'grid3x3';
            } else if (numCols === 4) {
                effectiveLayoutType = 'grid4xn';
            }

            // Apply intelligent spanning for grid layouts
            if (effectiveLayoutType.startsWith('grid')) {
                assignIntelligentSpans(panelsCopyForSimulation, numCols);
            }

            // Calculate panel sizing for this layout
            let canvasWidthForSizing = baseCanvasWidthPx;
            let panelAreaWidth, colWidth;

            if (effectiveLayoutType.startsWith('grid')) {
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
                colWidth = panelAreaWidth / numCols;
            } else {
                if (layoutOptions.labelPosition === 'left') {
                    canvasWidthForSizing -= (numCols * layoutOptions.labelWidth);
                }
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
                colWidth = panelAreaWidth / numCols;
            }

            // Set initial panel display dimensions
            panelsCopyForSimulation.forEach(panel => {
                const scale = colWidth / panel.originalWidth;
                panel.displayWidth = colWidth;
                panel.displayHeight = panel.originalHeight * scale;
            });

            // Call appropriate layout function
            let layoutDimensions;
            switch (effectiveLayoutType) {
                case 'stack':
                    layoutDimensions = layoutVerticalStack(panelsCopyForSimulation, layoutOptions);
                    break;
                case 'grid2x2':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthPx;
                    layoutDimensions = layoutSpanningGrid(panelsCopyForSimulation, 2, layoutOptions);
                    break;
                case 'grid3x3':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthPx;
                    layoutDimensions = layoutSpanningGrid(panelsCopyForSimulation, 3, layoutOptions);
                    break;
                case 'grid4xn':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthPx;
                    layoutDimensions = layoutSpanningGrid(panelsCopyForSimulation, 4, layoutOptions);
                    break;
                default:
                    layoutDimensions = layoutVerticalStack(panelsCopyForSimulation, layoutOptions);
                    break;
            }

            // Calculate minimum DPI for this layout
            let minDPI = Infinity;
            panelsCopyForSimulation.forEach(panel => {
                const displayWidthInMm = panel.displayWidth / PIXELS_PER_MM;
                const displayWidthInInches = displayWidthInMm * INCHES_PER_MM;
                const effectiveDpi = panel.originalWidth / displayWidthInInches;
                minDPI = Math.min(minDPI, effectiveDpi);
            });

            // Store candidate result
            candidateLayouts.push({
                layoutType: effectiveLayoutType,
                numCols: numCols,
                width: layoutDimensions.width,
                height: layoutDimensions.height,
                minDPI: minDPI,
                panelsData: panelsCopyForSimulation
            });
        }

        // Selection logic
        const targetWidthPx = baseCanvasWidthPx;

        // Filter by width - first try single column width
        let filteredLayouts = candidateLayouts.filter(layout => layout.width <= targetWidthPx);

        // If no layouts fit single column, try double column if available
        if (filteredLayouts.length === 0 && journalRules.doubleColumnWidth_mm) {
            const doubleColumnWidthPx = journalRules.doubleColumnWidth_mm * PIXELS_PER_MM;
            filteredLayouts = candidateLayouts.filter(layout => layout.width <= doubleColumnWidthPx);
        }

        // If still no layouts fit, keep all as fallback
        if (filteredLayouts.length === 0) {
            filteredLayouts = candidateLayouts;
        }

        // Sort candidates by:
        // 1. Highest layout preference score first
        // 2. Then by highest minDPI
        // 3. Then by smallest height
        // 4. Finally by smallest width
        filteredLayouts.sort((a, b) => {
            const scoreA = getLayoutPreferenceScore(a.layoutType, a.numCols, panels.length, a.width); // Pass calculated width
            const scoreB = getLayoutPreferenceScore(b.layoutType, b.numCols, panels.length, b.width); // Pass calculated width

            if (scoreA !== scoreB) return scoreB - scoreA; // Highest score first

            if (b.minDPI !== a.minDPI) return b.minDPI - a.minDPI; // Highest DPI first

            // Penalize layouts that make the canvas excessively tall for the width
            const aspectRatioA = a.width / a.height;
            const aspectRatioB = b.width / b.height;
            // Prefer squarer or slightly wider aspects over very tall ones, unless it's a stack
            if (aspectRatioA > 0.5 && aspectRatioB > 0.5) { // Only apply if not already extremely tall
                if (Math.abs(aspectRatioA - 1) !== Math.abs(aspectRatioB - 1)) {
                    return Math.abs(aspectRatioA - 1) - Math.abs(aspectRatioB - 1); // Closer to 1 (square) is better
                }
            }

            if (a.height !== b.height) return a.height - b.height; // Smallest height second

            return a.width - b.width; // Smallest width third
        });

        // Select best layout
        const bestLayout = filteredLayouts[0] || {
            layoutType: 'stack',
            panelsData: panels
        };

        return {
            panels: bestLayout.panelsData,
            effectiveLayout: bestLayout.layoutType,
            report: {
                width: Math.round(bestLayout.width / PIXELS_PER_MM), // in mm
                height: Math.round(bestLayout.height / PIXELS_PER_MM), // in mm
                minDPI: Math.round(bestLayout.minDPI),
                chosenType: bestLayout.layoutType // e.g., 'grid2x2'
            }
        };
    }


    function updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
        }
    }

    // Global debouncing mechanism for mini preview updates
    let globalPreviewUpdateTimeout = null;
    let isPreviewUpdateScheduled = false;
    let lastUpdateHash = null; // Track if there are actual changes

    // UPDATED: This function updates the mini preview canvas with real-time edits
    function updateMiniPreview(forceUpdate = false) {
        // Prevent multiple simultaneous calls unless forced
        if (isPreviewUpdateScheduled && !forceUpdate) {
            return;
        }

        // Only update if we have an active figure and panels
        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex] || 
            !project.figures[activeFigureIndex].panels || 
            project.figures[activeFigureIndex].panels.length === 0) {
            return;
        }

        // Create a more comprehensive hash of current state to catch all changes
        const activeFigure = project.figures[activeFigureIndex];
        const currentHash = JSON.stringify({
            panelCount: activeFigure.panels.length,
            layout: activeFigure.settings.layout,
            effectiveLayout: activeFigure.effectiveLayout,
            spacing: activeFigure.settings.spacing,
            labelPosition: activeFigure.settings.labelPosition,
            labelStyle: activeFigure.settings.labelStyle,
            labelFontSize: activeFigure.settings.labelFontSize,
            labelFontFamily: activeFigure.settings.labelFontFamily,
            labelFontWeight: activeFigure.settings.labelFontWeight,
            labelSpacing: activeFigure.settings.labelSpacing,
            maintainAspectRatio: activeFigure.settings.maintainAspectRatio,
            targetWidth: activeFigure.settings.targetWidth,
            journal: activeFigure.settings.journal,
            // Include panel positions and properties that change during interaction
            panelStates: activeFigure.panels.map(panel => ({
                id: panel.id,
                order: panel.order,
                label: panel.label,
                imageX: panel.imageX,
                imageY: panel.imageY,
                displayWidth: panel.displayWidth,
                displayHeight: panel.displayHeight,
                customX: panel.customX,
                customY: panel.customY,
                customWidth: panel.customWidth,
                customHeight: panel.customHeight,
                edits: panel.edits
            })),
            editingPanel: currentlyEditingPanel ? currentlyEditingPanel.id : null,
            editingValues: currentlyEditingPanel ? {
                brightness: brightnessSlider ? brightnessSlider.value : 100,
                contrast: contrastSlider ? contrastSlider.value : 100,
                rotation: rotateSlider ? rotateSlider.value : 0,
                cropBox: cropBox
            } : null,
            // Include canvas dimensions to detect layout changes
            canvasWidth: figureCanvas ? figureCanvas.width : 0,
            canvasHeight: figureCanvas ? figureCanvas.height : 0
        });

        // If nothing changed and not forced, don't update
        if (currentHash === lastUpdateHash && !forceUpdate) {
            return;
        }

        lastUpdateHash = currentHash;

        // Clear any existing timeout
        if (globalPreviewUpdateTimeout) {
            clearTimeout(globalPreviewUpdateTimeout);
        }

        isPreviewUpdateScheduled = true;

        // Use shorter timeout since we now have better change detection
        globalPreviewUpdateTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                try {
                    // Update all mini preview canvases only if they're visible
                    if (miniPreviewCanvas && miniPreviewCtx) {
                        updateMiniPreviewCanvas(miniPreviewCanvas, miniPreviewCtx);
                    }
                    if (sidebarPreviewCanvas && sidebarPreviewCtx && 
                        !sidebarPreviewContainer.classList.contains('collapsed')) {
                        updateMiniPreviewCanvas(sidebarPreviewCanvas, sidebarPreviewCtx);
                    }
                    // Always update edit modal preview if modal is open, regardless of collapsed state
                    if (isEditModalOpen && editModalMiniPreviewCanvas && editModalMiniPreviewCtx) {
                        updateMiniPreviewCanvas(editModalMiniPreviewCanvas, editModalMiniPreviewCtx);
                    }
                } catch (error) {
                    console.warn('Mini preview update failed:', error);
                } finally {
                    isPreviewUpdateScheduled = false;
                }
            });
        }, forceUpdate ? 50 : 100); // Faster update when forced
    }

    function updateMiniPreviewCanvas(canvas, ctx) {
        if (!canvas || !ctx || activeFigureIndex === -1 || !project.figures[activeFigureIndex]) {
            if (canvas && ctx && canvas.width > 0 && canvas.height > 0) {
                try {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } catch (e) {
                    console.warn('Canvas context error:', e);
                }
            }
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        if (!activeFigure.panels || activeFigure.panels.length === 0) {
            if (ctx && canvas.width > 0 && canvas.height > 0) {
                try {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                } catch (e) {
                    console.warn('Canvas context error:', e);
                }
            }
            return;
        }

        // Get current main canvas dimensions without zoom/pan
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Temporarily render without zoom/pan to get base dimensions
        const settings = activeFigure.settings;
        const rules = allJournalRules[settings.journal] || allJournalRules['Default'];
        const spacing = parseInt(settings.spacing);

        // Calculate canvas width with improved logic for visual consistency
        let baseCanvasWidthMM = settings.targetWidth !== null ? settings.targetWidth : rules.doubleColumnWidth_mm;

        // Apply minimum width constraint and scaling for narrow journals
        if (settings.targetWidth === null) { // Only apply to journal-preset widths, not custom widths
            if (baseCanvasWidthMM < MIN_CANVAS_WIDTH_MM) {
                // For very narrow journals like Science, scale up for better visual experience
                baseCanvasWidthMM = Math.max(MIN_CANVAS_WIDTH_MM, baseCanvasWidthMM * JOURNAL_SCALE_FACTOR);
            }
        }

        const font = `${settings.labelFontWeight} ${settings.labelFontSize * PT_TO_PX}px ${settings.labelFontFamily}`;
        tempCtx.font = font;

        // Calculate precise label dimensions by checking all panels
        let maxLabelWidth = 0;
        let effectiveLabelHeight = 0;

        activeFigure.panels.forEach((panel, index) => {
            // Generate the actual label text that will be displayed
            let labelText = panel.label;
            if (settings.labelStyle !== 'custom') {
                labelText = String.fromCharCode(65 + index);
                if (settings.labelStyle === 'ABC_paren') labelText += ')';
                if (settings.labelStyle === 'ABC_period') labelText += '.';
                if (settings.labelStyle === 'abc') labelText = labelText.toLowerCase();
            }

            const textMetrics = tempCtx.measureText(labelText);
            maxLabelWidth = Math.max(maxLabelWidth, textMetrics.width);

            if (effectiveLabelHeight === 0) {
                effectiveLabelHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                if (!effectiveLabelHeight || effectiveLabelHeight <= 0) {
                    effectiveLabelHeight = (settings.labelFontSize * PT_TO_PX) * 1.2;
                }
            }
        });

        const labelWidth = maxLabelWidth;
        const labelHeight = effectiveLabelHeight;

        const layoutOptions = {
            spacing: spacing,
            labelPosition: settings.labelPosition,
            labelWidth: labelWidth,
            labelHeight: labelHeight,
            labelSpacing: settings.labelSpacing || 0,
            maintainAspectRatio: settings.maintainAspectRatio
        };

        let effectiveLayout = settings.layout;
        let numCols = 1;
        if (effectiveLayout === 'auto') {
            // Use the stored effective layout from Smart Layout selection, or default to 'stack'
            effectiveLayout = activeFigure.effectiveLayout || 'stack';
        }

        if (effectiveLayout === 'grid2x2') numCols = 2;
        if (effectiveLayout === 'grid3x3') numCols = 3;

        let canvasWidthForSizing = baseCanvasWidthMM * PIXELS_PER_MM;
        let panelAreaWidth, colWidth;
        if (effectiveLayout.startsWith('grid')) {
            panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
            colWidth = panelAreaWidth / numCols;
        } else {
            if (layoutOptions.labelPosition === 'left') {
                canvasWidthForSizing -= (numCols * layoutOptions.labelWidth);
            }
            panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
            colWidth = panelAreaWidth / numCols;
        }

        // Create panels copy and apply real-time edits for preview
        const panelsCopy = JSON.parse(JSON.stringify(activeFigure.panels));
        const panelPromises = panelsCopy.map(async (panel, i) => {
            const originalPanel = activeFigure.panels[i];
            panel.image = originalPanel.image;

            // If this is the currently editing panel, apply real-time edits
            if (currentlyEditingPanel && originalPanel.id === currentlyEditingPanel.id) {
                const currentEdits = {
                    ...originalPanel.edits,
                    brightness: brightnessSlider.value,
                    contrast: contrastSlider.value,
                    rotation: rotateSlider.value,
                    crop: cropBox ? { ...cropBox } : null,
                    greyscale: currentlyEditingPanel.edits.greyscale || 0
                };

                try {
                    const editedSrc = await generateEditedImage(originalPanel.pristineSrc, currentEdits, 0.2); // Use low scale for preview
                    const previewImg = new Image();
                    return new Promise(resolve => {
                        previewImg.onload = () => {
                            panel.image = previewImg;
                            panel.originalWidth = previewImg.width;
                            panel.originalHeight = previewImg.height;
                            resolve(panel);
                        };
                        previewImg.src = editedSrc;
                    });
                } catch (error) {
                    console.warn('Mini preview generation failed, using original:', error);
                    return panel;
                }
            }
            return panel;
        });

        Promise.all(panelPromises).then(processedPanels => {
            let layoutDimensions;
            switch (effectiveLayout) {
                case 'stack': layoutDimensions = layoutVerticalStack(processedPanels, layoutOptions); break;
                case 'grid2x2':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                    layoutDimensions = layoutSpanningGrid(processedPanels, 2, layoutOptions);
                    break;
                case 'grid3x3':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                    layoutDimensions = layoutSpanningGrid(processedPanels, 3, layoutOptions);
                    break;
                case 'grid4xn':
                    layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                    layoutDimensions = layoutSpanningGrid(processedPanels, 4, layoutOptions);
                    break;
                case 'custom':
                    layoutDimensions = layoutCustom(processedPanels, layoutOptions);
                    break;
                default: layoutDimensions = layoutVerticalStack(processedPanels, layoutOptions); break;
            }

            // Calculate available space in container, accounting for padding and header
            const container = canvas.parentElement;
            const containerRect = container.getBoundingClientRect();

            // Get more accurate container dimensions
            let containerPadding = 30; // Account for padding
            let headerHeight = 60; // Account for header and info text

            // Special handling for edit modal preview
            if (canvas === editModalMiniPreviewCanvas) {
                containerPadding = 20; // Less padding for edit modal
                headerHeight = 45; // Account for smaller header in edit modal
            }

            const availableWidth = container.clientWidth;
            const availableHeight = container.clientHeight;

            // Calculate scale to fit entire figure within available space
            const scaleX = availableWidth / layoutDimensions.width;
            const scaleY = availableHeight / layoutDimensions.height;
            const previewScale = Math.min(scaleX, scaleY, 1); // Ensure we don't scale up beyond 100%

            // Set canvas dimensions to show the entire scaled figure
            const canvasWidth = layoutDimensions.width * previewScale;
            const canvasHeight = layoutDimensions.height * previewScale;

            // For edit modal preview, ensure we use the full available space
            if (canvas === editModalMiniPreviewCanvas) {
                // Use available space more effectively for edit modal
                canvas.width = Math.max(canvasWidth, Math.min(availableWidth, 320));
                canvas.height = Math.max(canvasHeight, Math.min(availableHeight, 240));
            } else {
                // Ensure minimum dimensions but prioritize showing complete figure
                canvas.width = Math.max(canvasWidth, 100);
                canvas.height = Math.max(canvasHeight, 75);
            }

            // Clear and prepare canvas
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Center the figure if the canvas is larger than the scaled figure
            const offsetX = (canvas.width - canvasWidth) / 2;
            const offsetY = (canvas.height - canvasHeight) / 2;

            ctx.translate(offsetX, offsetY);
            ctx.scale(previewScale, previewScale);

            // Draw white background for the figure area
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, layoutDimensions.width, layoutDimensions.height);

            // Draw panels using the same logic as main canvas
            const previewOptions = {
                ...settings,
                zoom: 1.0,
                isExport: false,
                labelFontSize: settings.labelFontSize,
                labelSpacing: settings.labelSpacing || 0
            };
            drawFigureOnCanvas(ctx, canvas, layoutDimensions, processedPanels, previewOptions);

            // Draw viewport indicator when zoomed (scaled appropriately)
            if (currentZoom > 1) {
                const containerRect = document.getElementById('figure-canvas-container').getBoundingClientRect();

                // Calculate viewport area in canvas coordinates
                const viewportWidth = containerRect.width / currentZoom;
                const viewportHeight = containerRect.height / currentZoom;
                const viewportX = -canvasPanX / currentZoom;
                const viewportY = -canvasPanY / currentZoom;

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2 / previewScale; // Scale line width appropriately
                ctx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
            }

            ctx.restore();
        }).catch(error => {
            console.warn('Mini preview update failed:', error);
        });
    }

    // --- 5. CORE RENDERING LOGIC ---
    async function renderFigure(skipCentering = false) {
        updateUploadUIVisibility();
        if (!skipCentering) {
            updateZoomDisplay(); // Update zoom display when rendering
        }

        if (activeFigureIndex === -1 || !project.figures || !project.figures[activeFigureIndex] || project.figures[activeFigureIndex].panels.length === 0) {
            figureCanvas.width = 0;
            figureCanvas.height = 0;
            feedbackList.innerHTML = '<li>Upload panels to see quality feedback.</li>';
            customLabelsContainer.style.display = 'none';
            individualExportContainer.classList.add('hidden');
            individualExportContainer.classList.remove('has-content');
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        const settings = activeFigure.settings;
        const rules = allJournalRules[settings.journal] || allJournalRules['Default'];
        if (!rules) { 
            console.warn('No journal rules available, using fallback defaults');
            return; 
        }

        const spacing = parseInt(settings.spacing);
        activeFigure.panels.sort((a, b) => a.order - b.order);

        // Calculate canvas width with improved logic for visual consistency
        let baseCanvasWidthMM = settings.targetWidth !== null ? settings.targetWidth : rules.doubleColumnWidth_mm;

        // Apply minimum width constraint and scaling for narrow journals
        if (settings.targetWidth === null) { // Only apply to journal-preset widths, not custom widths
            if (baseCanvasWidthMM < MIN_CANVAS_WIDTH_MM) {
                // For very narrow journals like Science, scale up for better visual experience
                baseCanvasWidthMM = Math.max(MIN_CANVAS_WIDTH_MM, baseCanvasWidthMM * JOURNAL_SCALE_FACTOR);
            }
        }

        const font = `${settings.labelFontWeight} ${settings.labelFontSize * PT_TO_PX}px ${settings.labelFontFamily}`;
        ctx.font = font;

        // Calculate precise label dimensions by checking all panels
        let maxLabelWidth = 0;
        let effectiveLabelHeight = 0;

        activeFigure.panels.forEach((panel, index) => {
            // Generate the actual label text that will be displayed
            let labelText = panel.label;
            if (settings.labelStyle !== 'custom') {
                labelText = String.fromCharCode(65 + index);
                if (settings.labelStyle === 'ABC_paren') labelText += ')';
                if (settings.labelStyle === 'ABC_period') labelText += '.';
                if (settings.labelStyle === 'abc') labelText = labelText.toLowerCase();
            }

            const textMetrics = ctx.measureText(labelText);
            maxLabelWidth = Math.max(maxLabelWidth, textMetrics.width);

            if (effectiveLabelHeight === 0) {
                effectiveLabelHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
                if (!effectiveLabelHeight || effectiveLabelHeight <= 0) {
                    effectiveLabelHeight = (settings.labelFontSize * PT_TO_PX) * 1.2;
                }
            }
        });

        const labelWidth = maxLabelWidth;
        const labelHeight = effectiveLabelHeight;

        const layoutOptions = { 
            spacing: spacing,
            labelPosition: settings.labelPosition,
            labelWidth: labelWidth,
            labelHeight: labelHeight,
            labelSpacing: settings.labelSpacing || 0,
            maintainAspectRatio: settings.maintainAspectRatio
        };

        let effectiveLayout = settings.layout;
        let numCols = 1;

        // Smart layout selection for 'auto' layouts
        let smartLayoutReport = null;
        if (effectiveLayout === 'auto') {
            const { panels: smartLayoutPanels, effectiveLayout: chosenLayoutType, report } = await selectSmartLayout(activeFigure.panels, settings, rules);
            activeFigure.panels = smartLayoutPanels;
            effectiveLayout = chosenLayoutType;
            smartLayoutReport = report;
            // Store the effective layout for use by other functions
            activeFigure.effectiveLayout = chosenLayoutType;
        } else {
            // Store the explicit layout choice as well
            activeFigure.effectiveLayout = effectiveLayout;
        }

        if (effectiveLayout === 'grid2x2') numCols = 2;
        if (effectiveLayout === 'grid3x3') numCols = 3;
        if (effectiveLayout === 'grid4xn') numCols = 4;

        let canvasWidthForSizing = baseCanvasWidthMM * PIXELS_PER_MM;

        // Only recalculate panel dimensions for non-auto layouts or custom layouts
        if (settings.layout !== 'auto' && effectiveLayout !== 'custom') {
            // For spanning grids, we need to handle width differently
            let panelAreaWidth, colWidth;
            if (effectiveLayout.startsWith('grid')) {
                // Don't subtract label width here for spanning grids, it's handled in the layout function
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
                colWidth = panelAreaWidth / numCols;
            } else {
                // For non-spanning layouts, subtract label width
                if (layoutOptions.labelPosition === 'left') {
                    canvasWidthForSizing -= (numCols * layoutOptions.labelWidth);
                }
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * spacing);
                colWidth = panelAreaWidth / numCols;
            }

            activeFigure.panels.forEach(panel => {
                const scale = colWidth / panel.originalWidth;
                panel.displayWidth = colWidth;
                panel.displayHeight = panel.originalHeight * scale;
            });
        }

        let layoutDimensions;
        switch (effectiveLayout) {
            case 'stack': layoutDimensions = layoutVerticalStack(activeFigure.panels, layoutOptions); break;
            case 'grid2x2':
                layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                layoutDimensions = layoutSpanningGrid(activeFigure.panels, 2, layoutOptions);
                break;
            case 'grid3x3':
                layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                layoutDimensions = layoutSpanningGrid(activeFigure.panels, 3, layoutOptions);
                break;
            case 'grid4xn':
                layoutOptions.baseCanvasWidth = baseCanvasWidthMM * PIXELS_PER_MM;
                layoutDimensions = layoutSpanningGrid(activeFigure.panels, 4, layoutOptions);
                break;
            case 'custom':
                layoutDimensions = layoutCustom(activeFigure.panels, layoutOptions);
                break;
            default: layoutDimensions = layoutVerticalStack(activeFigure.panels, layoutOptions); break;
        }

        // FIXED DIMENSIONS: Canvas intrinsic dimensions remain constant regardless of zoom
        figureCanvas.width = layoutDimensions.width;
        figureCanvas.height = layoutDimensions.height;

        // Apply zoom and pan via CSS transform for visual magnification only
        // DEBUG: log before renderFigure applies transform
        const wrapper = document.getElementById('canvas-wrapper');
        if (wrapper) {
            wrapper.style.transform = `scale(${currentZoom})`;
            wrapper.style.transformOrigin = '0 0';
        }
        const translatePart = (canvasPanX !== 0 || canvasPanY !== 0)
            ? `translate(${canvasPanX}px, ${canvasPanY}px)`
            : 'translate(0px, 0px)';
        figureCanvas.style.transform = translatePart;
        figureCanvas.style.transformOrigin = '0 0';

        // Reset context transformation - no zoom scaling in context
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, layoutDimensions.width, layoutDimensions.height);

        // Draw at the fixed resolution without zoom scaling
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, layoutDimensions.width, layoutDimensions.height);
        drawFigureOnCanvas(ctx, figureCanvas, layoutDimensions, activeFigure.panels, { ...settings, zoom: 1.0, isExport: false });

        if (isDragging && draggedPanel) {
            ctx.globalAlpha = 0.8;
            ctx.drawImage(draggedPanel.image, dragStartX, dragStartY, draggedPanel.displayWidth, draggedPanel.displayHeight);
            ctx.globalAlpha = 1.0;
        }

        if (!isDragging) {
          runQualityChecks(smartLayoutReport);
          // Force update mini preview after rendering
          updateMiniPreview(true);
        }

    // Only update container size and center canvas when container size changes, not for other figure edits
    // This prevents zoom level from being reset when making figure changes
    if (!skipCentering && !isZooming) {
        // Only recalculate container size and zoom when container size mode changes
        // For all other changes (figure editing, panel modification, etc.), preserve the current zoom
        if (containerSizeMode === 'auto') {
            // For auto mode, we still need to update container size but preserve zoom
            updateContainerSizeOnly();
        }
        // Removed the automatic centerAndFitCanvas() call for non-auto modes
        // This will only be called explicitly when container size changes
    }
    }

    function redrawCanvasOnly() {
        if (activeFigureIndex === -1 || !project.figures || !project.figures[activeFigureIndex] || project.figures[activeFigureIndex].panels.length === 0) {
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];

        // Apply zoom and pan via CSS transform for visual magnification only
        updateCanvasTransform();

        // Reset context transformation - no zoom scaling in context
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, figureCanvas.width, figureCanvas.height);

        // Draw at the fixed resolution without zoom scaling
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, figureCanvas.width, figureCanvas.height);

        const dimensions = { width: figureCanvas.width, height: figureCanvas.height };
        drawFigureOnCanvas(ctx, figureCanvas, dimensions, activeFigure.panels, { ...activeFigure.settings, zoom: 1.0, isExport: false });

        // Force update mini preview after redraw
        updateMiniPreview(true);
    }

    function drawFigureOnCanvas(canvasContext, targetCanvas, dimensions, panels, options) {
        canvasContext.fillStyle = 'white';
        // Fill the logical dimensions area (context scaling handles zoom)
        canvasContext.fillRect(0, 0, dimensions.width, dimensions.height);

        // Draw grid overlay only for display (not export) and if grid options are enabled
        const activeFigure = project.figures[activeFigureIndex];
        const isExport = options.isExport === true;
        if (activeFigure && !isExport) {
            const layoutToCheck = options.layout === 'auto' && activeFigure.effectiveLayout 
                ? activeFigure.effectiveLayout 
                : options.layout;

            const gridOptions = { 
                ...options, 
                layout: layoutToCheck,
                showPanelGrid: activeFigure.settings.showPanelGrid,
                showLabelGrid: activeFigure.settings.showLabelGrid
            };
            drawGridOverlay(canvasContext, dimensions, panels, gridOptions);
        }

        panels.forEach(panel => {
            if (options.isDragging && panel.id === options.draggedPanel.id) {
                canvasContext.globalAlpha = 0.4;
            }
            // Debug: Check if panel.image exists and has valid dimensions
            if (!panel.image) {
                console.warn('Panel image is null/undefined for panel:', panel.id);
                return;
            }
            if (panel.image.width === 0 || panel.image.height === 0) {
                console.warn('Panel image has zero dimensions for panel:', panel.id, 'dimensions:', panel.image.width, 'x', panel.image.height);
                return;
            }
            canvasContext.drawImage(panel.image, panel.imageX, panel.imageY, panel.displayWidth, panel.displayHeight);
            canvasContext.globalAlpha = 1.0;

            // Draw panel annotations on main canvas
            if (panel.edits && panel.edits.annotations && panel.edits.annotations.length > 0) {
                drawPanelAnnotationsOnMainCanvas(canvasContext, panel);
            }

            // Draw selection outline and resize handles for custom layout
            if (options.layout === 'custom' && selectedPanelCustom && panel.id === selectedPanelCustom.id) {
                drawCustomLayoutHandles(canvasContext, panel);
            }

            let labelText = panel.label;
            if (options.labelStyle !== 'custom') {
                if (options.labelStyle === 'ABC_paren') labelText += ')';
                if (options.labelStyle === 'ABC_period') labelText += '.';
                if (options.labelStyle === 'abc') labelText = labelText.toLowerCase();
            }

            // Font size should not be scaled by zoom here since context is already scaled
            const fontSize = options.labelFontSize * PT_TO_PX;
            const font = `${options.labelFontWeight} ${fontSize}px ${options.labelFontFamily}`;
            canvasContext.font = font;

            // Calculate actual label dimensions for this panel
            const labelMetrics = canvasContext.measureText(labelText);
            panel.actualLabelWidth = labelMetrics.width;
            panel.actualLabelHeight = fontSize;

            // Set text alignment for consistent top-left positioning
            canvasContext.fillStyle = 'black';
            canvasContext.textBaseline = 'top';
            canvasContext.textAlign = 'left';

            // Use the exact labelX and labelY from layout functions - no adjustments
            canvasContext.fillText(labelText, panel.labelX, panel.labelY);
        });
    }

    function drawCustomLayoutHandles(ctx, panel) {
        // Draw selection outline using custom coordinates
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(panel.customX - 1, panel.customY - 1, panel.customWidth + 2, panel.customHeight + 2);

        // Draw resize handles
        const handleSize = 8;
        ctx.fillStyle = '#007bff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        const handles = [
            { x: panel.customX, y: panel.customY }, // nw
            { x: panel.customX + panel.customWidth, y: panel.customY }, // ne
            { x: panel.customX, y: panel.customY + panel.customHeight }, // sw
            { x: panel.customX + panel.customWidth, y: panel.customY + panel.customHeight } // se
        ];

        handles.forEach(handle => {
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        });
    }

    // Function to draw grid overlay with consistent spacing
    function drawGridOverlay(ctx, dimensions, panels, options) {
        if (!panels.length || !ctx) return;

        // Check if grid should be shown
        const activeFigure = project.figures[activeFigureIndex];
        if (!activeFigure || !activeFigure.settings) return;

        // Get granular grid visibility options
        const showGrid = activeFigure.settings.showGrid === true;
        const showPanelGrid = options.showPanelGrid === true;
        const showLabelGrid = options.showLabelGrid === true;

        // Early return if no grids are enabled
        if (!showGrid && !showPanelGrid && !showLabelGrid) return;

        ctx.save();

        // Use grid settings with black as default color and 1px thickness
        const gridColor = activeFigure.settings.gridColor || '#000000';
        const gridThickness = activeFigure.settings.gridThickness || 1;
        const gridType = activeFigure.settings.gridType || 'dashed';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = gridThickness;

        // Set line dash based on grid type
        switch (gridType) {
            case 'solid':
                ctx.setLineDash([]);
                break;
            case 'dashed':
                ctx.setLineDash([5, 5]);
                break;
            case 'dotted':
                ctx.setLineDash([2, 3]);
                break;
            default:
                ctx.setLineDash([5, 5]);
        }

        let numCols = 1;
        if (options.layout === 'grid2x2') numCols = 2;
        else if (options.layout === 'grid3x3') numCols = 3;
        else if (options.layout === 'grid4xn') numCols = 4;

        // A. Draw Individual Panel Image Bounding Boxes
        if (showGrid && showPanelGrid) {
            panels.forEach(panel => {
                if (panel.imageX !== undefined && panel.imageY !== undefined && 
                    panel.displayWidth > 0 && panel.displayHeight > 0) {
                    ctx.strokeRect(
                        Math.round(panel.imageX),
                        Math.round(panel.imageY),
                        Math.round(panel.displayWidth),
                        Math.round(panel.displayHeight)
                    );
                }
            });
        }

        // B. Draw Global Label Alignment Grid Lines
        if (showGrid && showLabelGrid) {
            // Collect unique X-coordinates for vertical alignment lines
            const verticalAlignmentLines = new Set();
            // Collect unique Y-coordinates for horizontal alignment lines
            const horizontalAlignmentLines = new Set();

            panels.forEach(panel => {
                if (panel.labelX !== undefined && panel.labelY !== undefined && 
                    panel.actualLabelWidth > 0 && panel.actualLabelHeight > 0) {

                    // Apply label spacing to position (same logic as in drawFigureOnCanvas)
                    let labelX = panel.labelX;
                    let labelY = panel.labelY;
                    const labelSpacing = options.labelSpacing || 0;

                    if (options.labelPosition === 'top') {
                        labelY = panel.labelY - labelSpacing;
                    } else if (options.labelPosition === 'left') {
                        labelX = panel.labelX - labelSpacing;
                    }

                    // Add label boundaries to alignment line sets
                    verticalAlignmentLines.add(Math.round(labelX)); // Left edge
                    verticalAlignmentLines.add(Math.round(labelX + panel.actualLabelWidth)); // Right edge
                    horizontalAlignmentLines.add(Math.round(labelY)); // Top edge
                    horizontalAlignmentLines.add(Math.round(labelY + panel.actualLabelHeight)); // Bottom edge
                }
            });

            // Draw vertical alignment lines spanning full height
            verticalAlignmentLines.forEach(x => {
                if (x >= 0 && x <= dimensions.width) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, dimensions.height);
                    ctx.stroke();
                }
            });

            // Draw horizontal alignment lines spanning full width
            horizontalAlignmentLines.forEach(y => {
                if (y >= 0 && y <= dimensions.height) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(dimensions.width, y);
                    ctx.stroke();
                }
            });
        }

        // C. Draw Consistent Column Separator Lines (for Grid Layouts)
        if (showGrid && showPanelGrid && numCols > 1) {
            const spacing = parseInt(options.spacing || 10);

            // Calculate frame width per column
            let frameWidthPerCol = (dimensions.width - (spacing * (numCols + 1))) / numCols;

            // Draw vertical lines at logical column boundaries
            for (let i = 1; i < numCols; i++) {
                const x = Math.round(spacing + (i * (frameWidthPerCol + spacing)));
                if (x > 0 && x < dimensions.width) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, dimensions.height);
                    ctx.stroke();
                }
            }
        }

        // D. Draw Consistent Row Separator Lines (for Multi-row Grid Layouts)
        if (showGrid && showPanelGrid && numCols > 1) {
            const spacing = parseInt(options.spacing || 10);

            // Collect unique row boundaries
            const rowBoundaries = new Set();

            panels.forEach(panel => {
                // Calculate frame boundaries (including label space)
                let frameTop = panel.imageY;
                let frameBottom = panel.imageY + panel.displayHeight;

                // Adjust for label position
                if (options.labelPosition === 'top') {
                    const labelSpacing = options.labelSpacing || 0;
                    const adjustedLabelY = panel.labelY - labelSpacing;
                    if (adjustedLabelY < frameTop) {
                        frameTop = adjustedLabelY;
                    }
                }

                // Add frame boundaries (excluding canvas edges)
                if (frameTop > spacing) {
                    rowBoundaries.add(Math.round(frameTop - spacing / 2));
                }
                if (frameBottom < dimensions.height - spacing) {
                    rowBoundaries.add(Math.round(frameBottom + spacing / 2));
                }
            });

            // Draw horizontal separator lines
            rowBoundaries.forEach(y => {
                if (y > 0 && y < dimensions.height) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(dimensions.width, y);
                    ctx.stroke();
                }
            });
        }

        ctx.restore();
    }

    function updateUploadUIVisibility() {
        const panelsExist = activeFigureIndex > -1 && project.figures && project.figures[activeFigureIndex] && project.figures[activeFigureIndex].panels.length > 0;
        if (panelsExist) {
            uploadArea.classList.add('hidden');
            addPanelsBtn.classList.remove('hidden');
        } else {
            uploadArea.classList.remove('hidden');
            addPanelsBtn.classList.add('hidden');
        }
    }

    // --- 6. QUALITY CHECK LOGIC ---
    let qualityCheckTimeout;
    function runQualityChecks(smartLayoutReport = null) {
        clearTimeout(qualityCheckTimeout);
        qualityCheckTimeout = setTimeout(() => {
            if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) return;
            const activeFigure = project.figures[activeFigureIndex];

            feedbackList.innerHTML = '<li><i>Running quality checks...</i></li>';
            const rules = allJournalRules[activeFigure.settings.journal] || allJournalRules['Default'];
            const checkPromises = activeFigure.panels.map(panel => getPanelFeedback(panel, rules));

            Promise.all(checkPromises).then(feedbackResults => {
                // Arrays to organize feedback by priority
                const topMessages = [];
                const panelFeedbacks = [];
                const generalGuidance = [];

                // Add smart layout report to top messages if available
                if (activeFigure.settings.layout === 'auto' && smartLayoutReport) {
                    topMessages.push(`<li class="info"><strong>(🧠 Smart Layout Chosen: ${smartLayoutReport.chosenType})</strong><br>Figure Size: ${smartLayoutReport.width}x${smartLayoutReport.height}mm | Min Panel DPI: ${smartLayoutReport.minDPI}</li>`);
                }

                // Add text size guide to top messages
                if (rules.font_min_pt) {
                    topMessages.push(`<li class="good">(ℹ️ Text Size Guide) Journal recommends text at least ${rules.font_min_pt}pt. Compare to: <span style="font-size: ${rules.font_min_pt}pt; border: 1px solid #ccc; padding: 0 4px;">Sample Text</span></li>`);
                }

                // Group panel feedback with distinct colors
                feedbackResults.forEach((panelFeedback, index) => {
                    const colorClass = `panel-color-${index % 6}`; // Cycle through 6 colors
                    panelFeedbacks.push(`<div class="panel-feedback-group ${colorClass}">${panelFeedback}</div>`);
                });

                // Add figure width check to general guidance
                const maxAllowedWidth = (activeFigure.settings.targetWidth || rules.doubleColumnWidth_mm) * PIXELS_PER_MM;
                if (figureCanvas.width > maxAllowedWidth) {
                    generalGuidance.push(`<li class="error">(❌ Figure Too Wide) Current width (${Math.round(figureCanvas.width / PIXELS_PER_MM)}mm) exceeds limit of ${Math.round(maxAllowedWidth / PIXELS_PER_MM)}mm.</li>`);
                }

                // Add external editing guidance
                generalGuidance.push(`<li class="info">(💡 External Editing Tip) For issues like low resolution or small text within panels, you can: 1) Download individual panels (from "Export Individual Panels" card), 2) Edit their content (e.g., increase font sizes, simplify graphics) in an external image editor, and 3) Re-upload the improved panels to EasyFigAssembler.</li>`);

                // Assemble final HTML in the desired order
                const finalHTML = topMessages.join('') + panelFeedbacks.join('') + generalGuidance.join('');
                feedbackList.innerHTML = finalHTML;
            }).catch(error => {
                console.error('Quality check error:', error);
                feedbackList.innerHTML = '<li class="error">Quality check failed. Please try again.</li>';
            });
        }, 300);
    }

    async function getPanelFeedback(panel, rules) {
        const requiredDpi = rules.dpi_halftone || 300;
        const displayWidthInMm = panel.displayWidth / PIXELS_PER_MM;
        const displayWidthInInches = displayWidthInMm * INCHES_PER_MM;
        const displayHeightInInches = panel.displayHeight / PIXELS_PER_MM * INCHES_PER_MM;
        const effectiveDpi = panel.originalWidth / displayWidthInInches;

        let dpiStatusClass = 'good';
        let dpiMessage = `Panel ${panel.label}: Effective resolution is <strong>${Math.round(effectiveDpi)} DPI</strong>. `;
        if (effectiveDpi >= requiredDpi) { dpiMessage += `(✅ Good)`; }
        else if (effectiveDpi >= requiredDpi * 0.8) { dpiMessage += `(⚠️ Acceptable)`; dpiStatusClass = 'warning'; }
        else { dpiMessage += `(❌ Low Resolution)`; dpiStatusClass = 'error'; }
        const dpiFeedback = `<li class="${dpiStatusClass}">${dpiMessage}</li>`;

        // Calculate ideal source dimensions
        const idealOriginalWidth = displayWidthInInches * requiredDpi;
        const idealOriginalHeight = displayHeightInInches * requiredDpi;

        // Determine if there's a significant difference from the ideal
        let dimensionStatusClass = 'good';
        let dimensionMessage = `Panel ${panel.label}: Current display size is <strong>${Math.round(panel.displayWidth / PIXELS_PER_MM)}x${Math.round(panel.displayHeight / PIXELS_PER_MM)} mm</strong>. `;

        // Check if the current panel's original resolution is too low relative to its displayed size for the target DPI
        if (panel.originalWidth < idealOriginalWidth * 0.9 || panel.originalHeight < idealOriginalHeight * 0.9) { // 90% tolerance
            dimensionMessage += `To meet the journal's ${requiredDpi} DPI at this display size, its source should ideally be <strong>${Math.round(idealOriginalWidth)} x ${Math.round(idealOriginalHeight)} pixels</strong> or higher.`;
            dimensionStatusClass = 'warning';
        } else {
            dimensionMessage += `Source resolution is adequate for ${requiredDpi} DPI at this display size.`;
        }

        const dimensionFeedback = `<li class="${dimensionStatusClass}">${dimensionMessage}</li>`;

        const colorFeedbackResult = await analyzePanelColors(panel);
        const colorFeedback = `<li class="${colorFeedbackResult.statusClass}">${colorFeedbackResult.message}</li>`;
        return dpiFeedback + dimensionFeedback + colorFeedback;
    }

    function analyzePanelColors(panel) {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            const analysisWidth = 100;
            tempCanvas.width = analysisWidth;
            tempCanvas.height = panel.image.height * (analysisWidth / panel.image.width);
            tempCtx.drawImage(panel.image, 0, 0, tempCanvas.width, tempCanvas.height);
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            let hasRed = false; let hasGreen = false;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i]; const g = data[i+1]; const b = data[i+2];
                if (r > 120 && g < 100 && b < 100) hasRed = true;
                if (g > 120 && r < 100 && b < 100) hasGreen = true;
                if (hasRed && hasGreen) break;
            }
            if (hasRed && hasGreen) {
                const colorblindSafePalettes = [
                    '#1f77b4, #ff7f0e, #2ca02c', // Blue, Orange, Green
                    '#d62728, #9467bd, #8c564b', // Red, Purple, Brown
                    '#e377c2, #7f7f7f, #bcbd22'  // Pink, Gray, Olive
                ];
                const suggestion = colorblindSafePalettes[Math.floor(Math.random() * colorblindSafePalettes.length)];
                resolve({ 
                    message: `Panel ${panel.label}: (⚠️ Advisory) Uses red & green. Consider colorblind-safe alternatives: ${suggestion}`, 
                    statusClass: 'warning' 
                });
            } else {
                 resolve({ message: `Panel ${panel.label}: (✅ Colors friendly)`, statusClass: 'good' });
            }
        });
    }


    // --- 7. JOURNAL RULE LOADING AND CONTROLS ---
    async function loadJournalRules() {
        try {
            const response = await fetch('/api/journal-rules');
            if (!response.ok) throw new Error('Failed to load journal rules');
            allJournalRules = await response.json();
            populateJournalSelector();
        } catch (error) {
            console.error("Error loading journal rules:", error);
            // Provide comprehensive fallback rules
            allJournalRules = { 
                Default: { 
                    singleColumnWidth_mm: 90, 
                    doubleColumnWidth_mm: 180,
                    maxHeight_mm: 240,
                    dpi_halftone: 300, 
                    font_min_pt: 7 
                } 
            };
            // Always populate selector even with fallback
            populateJournalSelector();
        }
    }

    function populateJournalSelector() {
        journalSelect.innerHTML = '';
        for (const journalName in allJournalRules) {
            const option = document.createElement('option');
            option.value = journalName;
            option.textContent = journalName;
            journalSelect.appendChild(option);
        }
    }

    // --- 8. GLOBAL FUNCTIONS ---
    // Global handleSettingChange function for accessibility
    function handleSettingChange(key, value) {
        if(activeFigureIndex === -1) return;
        project.figures[activeFigureIndex].settings[key] = value;

        // Only save state if we're not restoring from undo/redo
        if (!isRestoringState) {
            saveState();
        }

        // For grid-related settings, only redraw without recalculating layout
        if (key.includes('Grid') || key.includes('grid')) {
            redrawCanvasOnly();
        } else {
            renderFigure();
        }
    }

    // Make it globally available immediately and ensure it's accessible
    window.handleSettingChange = handleSettingChange;

    // --- 9. EVENT LISTENERS ---

    function attachEventListeners() {
        // Collapsible sidebar cards
        document.addEventListener('click', (e) => {
            const cardHeader = e.target.closest('.card-header');
            if (cardHeader) {
                const card = cardHeader.closest('.sidebar-card, .main-content-card');
                if (card) {
                    card.classList.toggle('collapsed');
                }
            }
        });
    }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

            if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (!undoBtn.disabled) undo();
            } else if (cmdOrCtrl && ((e.key === 'y') || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (!redoBtn.disabled) redo();
            }
        });
        uploadArea.addEventListener('click', () => fileInput.click());
        addPanelsBtn.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadArea.style.backgroundColor = '#d0ebff';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.backgroundColor = '#f0f8ff';
        });
        uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadArea.style.backgroundColor = '#f0f8ff';
            handleFiles(event.dataTransfer.files);
        });
        fileInput.addEventListener('change', (event) => {
            handleFiles(event.target.files);
        });

        journalSelect.addEventListener('change', (e) => {
            const activeFigure = project.figures[activeFigureIndex];
            if (!activeFigure) return;
            activeFigure.settings.targetWidth = null;
            targetWidthInput.value = '';
            activeFigure.settings.journal = e.target.value;
            updateJournalInfoDisplay();
            saveState();
            renderFigure();
        });

        let renderTimeout;

        // Panel Spacing Functions
        function updateSpacingAll(val) {
            val = Math.round(Math.max(0, Math.min(50, val)));
            if (spacingSlider) {
                spacingSlider.value = val;
                // Update slider progress for visual fill
                const progress = (val / 50) * 100;
                spacingSlider.style.setProperty('--slider-progress', progress + '%');
            }
            if (spacingNumber) spacingNumber.value = val;
            if (spacingDecrease) spacingDecrease.disabled = val <= 0;
            if (spacingIncrease) spacingIncrease.disabled = val >= 50;
            if (spacingPreview) spacingPreview.style.setProperty('--current-spacing', val + 'px');
            if (spacingCurrentDisplay) spacingCurrentDisplay.textContent = val + 'px';
            handleSettingChange('spacing', val.toString());
        }

        labelStyleSelect.addEventListener('change', (e) => {
            handleSettingChange('labelStyle', e.target.value);
            updateAuxiliaryUI();
        });
        labelPositionSelect.addEventListener('change', (e) => handleSettingChange('labelPosition', e.target.value));
        labelFontFamilySelect.addEventListener('change', (e) => handleSettingChange('labelFontFamily', e.target.value));
        labelFontSizeInput.addEventListener('change', (e) => handleSettingChange('labelFontSize', e.target.value));
        labelFontWeightSelect.addEventListener('change', (e) => handleSettingChange('labelFontWeight', e.target.value));

        // Panel Spacing Event Listeners
        if (spacingSlider) {
            spacingSlider.addEventListener('input', (e) => {
                updateSpacingAll(parseInt(e.target.value));
            });
        }

        if (spacingNumber) {
            spacingNumber.addEventListener('input', (e) => {
                updateSpacingAll(parseInt(e.target.value) || 0);
            });
            spacingNumber.addEventListener('change', (e) => {
                updateSpacingAll(parseInt(e.target.value) || 0);
            });
        }

        if (spacingDecrease) {
            spacingDecrease.addEventListener('click', () => {
                const currentVal = spacingSlider ? parseInt(spacingSlider.value) : 10;
                updateSpacingAll(currentVal - 1);
            });
        }

        if (spacingIncrease) {
            spacingIncrease.addEventListener('click', () => {
                const currentVal = spacingSlider ? parseInt(spacingSlider.value) : 10;
                updateSpacingAll(currentVal + 1);
            });
        }

        if (spacingReset) {
            spacingReset.addEventListener('click', () => {
                updateSpacingAll(10);
            });
        }

        // Spacing Presets
        spacingPresets.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = parseInt(btn.dataset.value);
                if (!isNaN(value)) {
                    updateSpacingAll(value);
                }
            });
        });

        // Label Spacing Controls
        function updateLabelSpacingAll(val) {
            val = Math.round(Math.max(0, Math.min(30, val)));
            if (labelSpacingNumber) labelSpacingNumber.value = val;
            if (labelSpacingValue) labelSpacingValue.textContent = val;
            if (labelSpacingDecrease) labelSpacingDecrease.disabled = val <= 0;
            if (labelSpacingIncrease) labelSpacingIncrease.disabled = val >= 30;
            handleSettingChange('labelSpacing', val);
        }

        if (labelSpacingNumber) {
            labelSpacingNumber.addEventListener('input', (e) => {
                updateLabelSpacingAll(parseInt(e.target.value) || 0);
            });
            labelSpacingNumber.addEventListener('change', (e) => {
                updateLabelSpacingAll(parseInt(e.target.value) || 0);
            });
        }

        if (labelSpacingDecrease) {
            labelSpacingDecrease.addEventListener('click', () => {
                const currentVal = labelSpacingNumber ? parseInt(labelSpacingNumber.value) : 0;
                updateLabelSpacingAll(currentVal - 1);
            });
        }

        if (labelSpacingIncrease) {
            labelSpacingIncrease.addEventListener('click', () => {
                const currentVal = labelSpacingNumber ? parseInt(labelSpacingNumber.value) : 0;
                updateLabelSpacingAll(currentVal + 1);
            });
        }

        layoutOptionsContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('layout-btn')) {
                const layout = e.target.dataset.layout;

                // Add pressed effect
                e.target.classList.add('pressed');
                setTimeout(() => {
                    e.target.classList.remove('pressed');
                }, 150);

                // Reset custom layout state when switching away from custom
                if (layout !== 'custom') {
                    selectedPanelCustom = null;
                    isPanelDraggingCustom = false;
                    isPanelResizingCustom = false;
                    activeResizeHandleType = null;
                }

                // Special handling for Smart Layout
                if (layout === 'auto') {
                    // Show loading dialog immediately
                    showSmartLayoutLoadingDialog();

                    // Update layout setting and button selection immediately
                    handleSettingChange('layout', layout);
                    updateLayoutButtonSelection(layout);

                    // Add artificial delay for Smart Layout
                    await new Promise(resolve => setTimeout(resolve, 2500));

                    // Trigger rendering after delay
                    renderFigure();

                    // --- FIX: Ensure container is sized correctly after loading panels ---
                    if (containerSizeMode === 'auto') {
                        setContainerSize('auto');
                    }

                    // Hide loading dialog
                    hideSmartLayoutLoadingDialog();
                } else {
                    // For all other layouts, proceed normally
                    handleSettingChange('layout', layout);
                    updateLayoutButtonSelection(layout);
                }

                // Update span controls if modal is open
                if (isEditModalOpen) {
                    setTimeout(updateLayoutSpanControls, 100);
                }
            }
        });
        applyDimensionBtn.addEventListener('click', () => {
            const val = parseFloat(targetWidthInput.value);
            handleSettingChange('targetWidth', (val && val > 0) ? val : null);
            updateJournalInfoDisplay(); // Update journal info when custom width is applied
        });
        exportDpiSelect.addEventListener('change', (e) => {
            exportDpiCustom.style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
        });

        // Export format selection logic
        exportOptionCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active selection from all cards
                exportOptionCards.forEach(c => c.classList.remove('active-selection'));

                // Add active selection to clicked card
                card.classList.add('active-selection');

                // Set selected format
                selectedExportFormat = card.dataset.format;

                // Enable export button
                exportFigureBtn.disabled = false;
            });
        });

        // Export figure button logic
        exportFigureBtn.addEventListener('click', async () => {
            if (!selectedExportFormat) {
                alert('Please select an export format first.');
                return;
            }

            if (activeFigureIndex === -1 || !project.figures[activeFigureIndex] || project.figures[activeFigureIndex].panels.length === 0) {
                alert('Please upload panels before exporting.');
                return;
            }

            try {
                setLoadingState(exportFigureBtn, true);

                if (selectedExportFormat === 'png' || selectedExportFormat === 'jpeg') {
                    await exportHighResClientSide(selectedExportFormat, exportFigureBtn);
                } else if (selectedExportFormat === 'pdf' || selectedExportFormat === 'tiff') {
                    await exportWithBackend(selectedExportFormat, exportFigureBtn);
                }

                // Reset selection after successful export
                exportOptionCards.forEach(c => c.classList.remove('active-selection'));
                selectedExportFormat = null;
                exportFigureBtn.disabled = true;

                // Show feedback modal after successful export
                showFeedbackModal();

            } catch (error) {
                console.error('Export failed:', error);
                alert('Export failed. Please try again.');
            } finally {
                setLoadingState(exportFigureBtn, false);
            }
        });

        // Canvas pan and zoom
        const figureCanvasContainer = document.getElementById('figure-canvas-container');
        let potentialDragPanel = null;
        let mouseDownPos = null;
        const DRAG_THRESHOLD = 5; // pixels to move before starting drag

        // Context menu for right-click
        figureCanvasContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const mousePos = getMousePos(figureCanvas, e);
            const activeFigure = project.figures[activeFigureIndex];
            if (!activeFigure) return;

            // Find which panel was right-clicked
            for (let i = activeFigure.panels.length - 1; i >= 0; i--) {
                const panel = activeFigure.panels[i];
                if (isMouseOverPanel(mousePos, panel)) {
                    showContextMenu(e.clientX, e.clientY, panel);
                    break;
                }
            }
        });

        figureCanvasContainer.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                isPanning = true;
                panStartX = e.clientX - canvasPanX;
                panStartY = e.clientY - canvasPanY;
                figureCanvasContainer.style.cursor = 'grabbing';
                restoreContainerOverflow(); // Restore overflow when starting to pan
                e.preventDefault(); // Prevent text selection
            } else {
                const mousePos = getMousePos(figureCanvas, e);
                const activeFigure = project.figures[activeFigureIndex];
                if (!activeFigure) return;

                // Handle custom layout interactions
                if (activeFigure.settings.layout === 'custom') {
                    // Check for resize handle first
                    if (selectedPanelCustom) {
                        const handleType = getResizeHandle(mousePos, selectedPanelCustom);
                        if (handleType) {
                            isPanelResizingCustom = true;
                            activeResizeHandleType = handleType;
                            resizeStartPanelBounds = {
                                x: selectedPanelCustom.customX,
                                y: selectedPanelCustom.customY,
                                width: selectedPanelCustom.customWidth,
                                height: selectedPanelCustom.customHeight
                            };
                            dragStartMouseX = mousePos.x;
                            dragStartMouseY = mousePos.y;
                            restoreContainerOverflow(); // Restore overflow when resizing panels
                            return;
                        }
                    }

                    // Check for panel selection/dragging
                    for (let i = activeFigure.panels.length - 1; i >= 0; i--) {
                        const panel = activeFigure.panels[i];
                        if (isMouseOverPanel(mousePos, panel)) {
                            selectedPanelCustom = panel;
                            isPanelDraggingCustom = true;
                            dragStartPanelX = panel.customX;
                            dragStartPanelY = panel.customY;
                            dragStartMouseX = mousePos.x;
                            dragStartMouseY = mousePos.y;
                            restoreContainerOverflow(); // Restore overflow when interacting with panels
                            renderFigure();
                            return;
                        }
                    }

                    // Clicked on empty area - deselect
                    selectedPanelCustom = null;
                    renderFigure();
                    return;
                }

                // Original logic for non-custom layouts
                mouseDownPos = { x: e.clientX, y: e.clientY };

                // Find which panel was clicked
                for (let i = activeFigure.panels.length - 1; i >= 0; i--) {
                    const panel = activeFigure.panels[i];
                    if (isMouseOverPanel(mousePos, panel)) {
                        potentialDragPanel = {
                            panel: panel,
                            offsetX: mousePos.x - panel.imageX,
                            offsetY: mousePos.y - panel.imageY
                        };
                        break; // Stop after finding the top-most panel
                    }
                }
            }
        });

        figureCanvasContainer.addEventListener('mouseup', (e) => {
            if (isPanning && e.button === 1) {
                isPanning = false;
                figureCanvasContainer.style.cursor = 'default';
            } else if (isPanelDraggingCustom || isPanelResizingCustom) {
                // Handle custom layout interactions
                if (isPanelDraggingCustom || isPanelResizingCustom) {
                    saveState();
                    // Force preview update after custom layout change
                    updateMiniPreview(true);
                }
                isPanelDraggingCustom = false;
                isPanelResizingCustom = false;
                activeResizeHandleType = null;
                resizeStartPanelBounds = null;
                figureCanvasContainer.style.cursor = 'default';
            } else if (isDragging) {
                // Original drag-to-reorder logic for non-custom layouts
                const mousePos = getMousePos(figureCanvas, e);
                const activeFigure = project.figures[activeFigureIndex];

                const oldOrder = draggedPanel.order;
                let newOrder = oldOrder;

                // Find where the dragged panel was dropped
                const dropRect = {
                    x: mousePos.x - dragStartX,
                    y: mousePos.y - dragStartY,
                    width: draggedPanel.displayWidth,
                    height: draggedPanel.displayHeight
                };

                const panelsForReorder = activeFigure.panels.filter(p => p.id !== draggedPanel.id);
                panelsForReorder.sort((a,b) => a.order - b.order);

                let droppedOnPanel = null;

                // Find which panel the dragged panel was dropped on
                for (let i = 0; i < panelsForReorder.length; i++) {
                    const targetPanel = panelsForReorder[i];
                    if (dropRect.x < targetPanel.imageX + targetPanel.displayWidth &&
                        dropRect.x + dropRect.width > targetPanel.imageX &&
                        dropRect.y < targetPanel.imageY + targetPanel.displayHeight &&
                        dropRect.y + dropRect.height > targetPanel.imageY) {
                        droppedOnPanel = targetPanel;
                        break;
                    }
                }

                // Determine new order based on intersection/proximity
                if (droppedOnPanel) {
                    const droppedCenterY = dropRect.y + dropRect.height / 2;
                    const targetCenterY = droppedOnPanel.imageY + droppedOnPanel.displayHeight / 2;

                    if (droppedCenterY < targetCenterY) {
                        newOrder = droppedOnPanel.order;
                    } else {
                        newOrder = droppedOnPanel.order + 1;
                    }
                } else {
                    newOrder = activeFigure.panels.length - 1;
                }

                newOrder = Math.max(0, Math.min(newOrder, activeFigure.panels.length -1));

                // Reassign orders and labels
                activeFigure.panels.splice(activeFigure.panels.findIndex(p => p.id === draggedPanel.id), 1);
                activeFigure.panels.splice(newOrder, 0, draggedPanel);

                activeFigure.panels.forEach((panel, idx) => {
                    panel.order = idx;
                    if (activeFigure.settings.labelStyle !== 'custom') {
                        panel.label = String.fromCharCode(65 + idx);
                    }
                });

                saveState();
                isDragging = false;
                draggedPanel = null;
                figureCanvasContainer.style.cursor = 'default';
                renderFigure();
                updateAuxiliaryUI();
                // Force preview update after drag operation
                updateMiniPreview(true);
            } else {
                potentialDragPanel = null;
                mouseDownPos = null;
            }
        });

        figureCanvasContainer.addEventListener('mousemove', (e) => {
            const mousePos = getMousePos(figureCanvas, e);
            const activeFigure = project.figures[activeFigureIndex];

            if (isPanning) {
                canvasPanX = e.clientX - panStartX;
                window.canvasPanX = canvasPanX;
                canvasPanY = e.clientY - panStartY;
                window.canvasPanY = canvasPanY;
                restoreContainerOverflow();
                renderFigure();
            } else if (activeFigure && activeFigure.settings.layout === 'custom') {
                // Handle custom layout interactions
                if (isPanelResizingCustom && selectedPanelCustom && activeResizeHandleType) {
                    const deltaX = mousePos.x - dragStartMouseX;
                    const deltaY = mousePos.y - dragStartMouseY;
                    const maintainAspectRatio = e.shiftKey;

                    let newBounds = { ...resizeStartPanelBounds };

                    switch (activeResizeHandleType) {
                        case 'nw':
                            newBounds.x = resizeStartPanelBounds.x + deltaX;
                            newBounds.y = resizeStartPanelBounds.y + deltaY;
                            newBounds.width = resizeStartPanelBounds.width - deltaX;
                            newBounds.height = resizeStartPanelBounds.height - deltaY;
                            break;
                        case 'ne':
                            newBounds.y = resizeStartPanelBounds.y + deltaY;
                            newBounds.width = resizeStartPanelBounds.width + deltaX;
                            newBounds.height = resizeStartPanelBounds.height - deltaY;
                            break;
                        case 'sw':
                            newBounds.x = resizeStartPanelBounds.x + deltaX;
                            newBounds.width = resizeStartPanelBounds.width - deltaX;
                            newBounds.height = resizeStartPanelBounds.height + deltaY;
                            break;
                        case 'se':
                            newBounds.width = resizeStartPanelBounds.width + deltaX;
                            newBounds.height = resizeStartPanelBounds.height + deltaY;
                            break;
                    }

                    // Maintain aspect ratio if shift is held
                    if (maintainAspectRatio && selectedPanelCustom.originalWidth && selectedPanelCustom.originalHeight) {
                        const aspectRatio = selectedPanelCustom.originalWidth / selectedPanelCustom.originalHeight;
                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            newBounds.height = newBounds.width / aspectRatio;
                        } else {
                            newBounds.width = newBounds.height * aspectRatio;
                        }
                    }

                    // Apply snapping
                    const snapLines = getSnapPositions(activeFigure.panels, selectedPanelCustom);
                    newBounds.x = findNearestSnap(snapToGrid(newBounds.x), snapLines);
                    newBounds.y = findNearestSnap(snapToGrid(newBounds.y), snapLines);
                    newBounds.width = snapToGrid(Math.max(20, newBounds.width));
                    newBounds.height = snapToGrid(Math.max(20, newBounds.height));

                    // Update panel
                    selectedPanelCustom.customX = newBounds.x;
                    selectedPanelCustom.customY = newBounds.y;
                    selectedPanelCustom.customWidth = newBounds.width;
                    selectedPanelCustom.customHeight = newBounds.height;

                    renderFigure();
                    // Update preview during resize
                    updateMiniPreview(true);
                } else if (isPanelDraggingCustom && selectedPanelCustom) {
                    const deltaX = mousePos.x - dragStartMouseX;
                    const deltaY = mousePos.y - dragStartMouseY;

                    let newX = dragStartPanelX + deltaX;
                    let newY = dragStartPanelY + deltaY;

                    // Apply snapping
                    const snapLines = getSnapPositions(activeFigure.panels, selectedPanelCustom);
                    newX = findNearestSnap(snapToGrid(newX), snapLines);
                    newY = findNearestSnap(snapToGrid(newY), snapLines);

                    selectedPanelCustom.customX = newX;
                    selectedPanelCustom.customY = newY;

                    renderFigure();
                    // Update preview during drag
                    updateMiniPreview(true);
                } else {
                    // Update cursor based on what's under mouse
                    let cursor = 'default';
                    if (selectedPanelCustom) {
                        const handleType = getResizeHandle(mousePos, selectedPanelCustom);
                        if (handleType) {
                            cursor = handleType + '-resize';
                        } else if (isMouseOverPanel(mousePos, selectedPanelCustom)) {
                            cursor = 'move';
                        }
                    } else {
                        for (const panel of activeFigure.panels) {
                            if (isMouseOverPanel(mousePos, panel)) {
                                cursor = 'pointer';
                                break;
                            }
                        }
                    }
                    figureCanvasContainer.style.cursor = cursor;
                }
            } else if (isDragging) {
                // Original dragging logic for non-custom layouts
                const mousePos = getMousePos(figureCanvas, e);
                draggedPanel.imageX = mousePos.x - dragStartX;
                draggedPanel.imageY = mousePos.y - dragStartY;
                renderFigure();
                // Update preview during drag
                updateMiniPreview(true);
            } else {
                // Original hover logic for non-custom layouts
                let hovering = false;
                if(project.figures && project.figures[activeFigureIndex]) {
                    for (const panel of project.figures[activeFigureIndex].panels) {
                        if (isMouseOverPanel(mousePos, panel)) { hovering = true; break; }
                    }
                }
                figureCanvasContainer.style.cursor = hovering ? 'grab' : 'default';

                // Check if drag threshold is reached and start dragging
                if (potentialDragPanel && mouseDownPos) {
                    const distance = Math.sqrt(
                        Math.pow(e.clientX - mouseDownPos.x, 2) +
                        Math.pow(e.clientY - mouseDownPos.y, 2)
                    );

                    if (distance > DRAG_THRESHOLD) {
                        isDragging = true;
                        draggedPanel = potentialDragPanel.panel;
                        dragStartX = potentialDragPanel.offsetX;
                        dragStartY = potentialDragPanel.offsetY;
                        figureCanvasContainer.style.cursor = 'grabbing';
                        potentialDragPanel = null;
                        mouseDownPos = null;
                    }
                }
            }
        });

        // Remove mouse wheel zoom (commented out as per original file)
        /*figureCanvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault(); // Prevent scrolling

            // Get mouse position relative to canvas
            const rect = figureCanvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate zoom direction
            const zoomDirection = e.deltaY > 0 ? -1 : 1;

            // Calculate zoom factor
            const zoomFactor = 1 + zoomDirection * ZOOM_STEP;

            // Limit zoom
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * zoomFactor));

            // Calculate new pan position to zoom around the mouse
            const zoomChange = newZoom / currentZoom;
            canvasPanX = mouseX - zoomChange * mouseX + canvasPanX * zoomChange;
            window.canvasPanX = canvasPanX;
            canvasPanY = mouseY - zoomChange * mouseY + canvasPanY * zoomChange;
            window.canvasPanY = canvasPanY;

            // Apply zoom
            currentZoom = newZoom;
            renderFigure();
        });*/

        undoBtn.addEventListener('click', undo);
        redoBtn.addEventListener('click', redo);
        resetAllBtn.addEventListener('click', resetAllChanges);
        addFigureBtn.addEventListener('click', addFigure);
        saveProjectBtn.addEventListener('click', () => {
            if (!project.figures || project.figures.length === 0) {
                alert("Please create a figure and upload panels before saving.");
                return;
            }
            const projectState = getCurrentState();
            const projectJson = JSON.stringify(projectState, null, 2);
            const blob = new Blob([projectJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'figure-assembler-project.json';
            link.click();
            URL.revokeObjectURL(url);
        });
        loadProjectInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const loadedProject = JSON.parse(event.target.result);
                    historyStack = [];
                    redoStack = [];
                    loadProject(loadedProject);
                } catch (error) {
                    alert("Failed to load project file. It may be corrupted.");
                    console.error("Error parsing project file:", error);
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });

        // Demo button event listeners with visual feedback
        const demoBtns = [
            document.getElementById('demo-btn-1'),
            document.getElementById('demo-btn-2'),
            document.getElementById('demo-btn-3')
        ];

        demoBtns.forEach((btn, index) => {
            if (btn) {
                btn.addEventListener('click', async () => {
                    // Reset all demo buttons to default state
                    demoBtns.forEach(b => {
                        b.classList.remove('loading', 'success');
                        b.disabled = false;
                    });

                    // Set clicked button to loading state
                    btn.classList.add('loading');
                    btn.disabled = true;
                    const originalText = btn.textContent;
                    btn.textContent = 'Loading...';

                    try {
                        await loadDemoPanels(index + 1);

                        // Show success state
                        btn.classList.remove('loading');
                        btn.classList.add('success');
                        btn.textContent = 'Loaded!';

                        // Reset to normal state after 2 seconds
                        setTimeout(() => {
                            btn.classList.remove('success');
                            btn.textContent = originalText;
                            btn.disabled = false;
                        }, 2000);

                    } catch (error) {
                        // Reset to normal state on error
                        btn.classList.remove('loading');
                        btn.textContent = originalText;
                        btn.disabled = false;
                        console.error('Demo loading failed:', error);
                    }
                });
            }
        });
        figureTabsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-tab-btn')) {
                const index = parseInt(e.target.dataset.index);
                deleteFigure(index);
            } else {
                const tab = e.target.closest('.figure-tab');
                if (tab) {
                    const index = parseInt(tab.dataset.index);
                    if (index !== activeFigureIndex) {
                        switchFigure(index);
                    }
                }
            }
        });

        maintainAspectRatioCheckbox.addEventListener('change', () => {
            if(activeFigureIndex === -1) return;
            project.figures[activeFigureIndex].settings.maintainAspectRatio = maintainAspectRatioCheckbox.checked;
            saveState();
            renderFigure();
        });

        // Grid control event listeners with hierarchical dependency logic
        if (showGridCheckbox) {
            showGridCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                handleSettingChange('showGrid', isChecked);
                updateGridControlsState(isChecked);

                // When Show Grid is checked, automatically check both sub-options
                if (isChecked) {
                    if (showPanelGridCheckbox) {
                        showPanelGridCheckbox.checked = true;
                        handleSettingChange('showPanelGrid', true);
                    }
                    if (showLabelGridCheckbox) {
                        showLabelGridCheckbox.checked = true;
                        handleSettingChange('showLabelGrid', true);
                    }
                }
            });
        }

        if (showPanelGridCheckbox) {
            showPanelGridCheckbox.addEventListener('change', (e) => {
                handleSettingChange('showPanelGrid', e.target.checked);
            });
        }

        if (showLabelGridCheckbox) {
            showLabelGridCheckbox.addEventListener('change', (e) => {
                handleSettingChange('showLabelGrid', e.target.checked);
            });
        }

        if (gridColorInput) {
            gridColorInput.addEventListener('change', (e) => {
                handleSettingChange('gridColor', e.target.value);
            });
        }

        if (gridTypeSelect) {
            gridTypeSelect.addEventListener('change', (e) => {
                handleSettingChange('gridType', e.target.value);
            });
        }

        if (gridThicknessInput) {
            gridThicknessInput.addEventListener('change', (e) => {
                handleSettingChange('gridThickness', parseInt(e.target.value));
            });
        }

        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');
        zoomInBtn.addEventListener('click', zoomIn);
        zoomOutBtn.addEventListener('click', zoomOut);
        zoomResetBtn.addEventListener('click', resetZoom);

        // NEW: Additional controls
        if (fitToPageBtn) fitToPageBtn.addEventListener('click', fitToPage);

        // Container size controls
        if (containerSizeSelect) {
            containerSizeSelect.addEventListener('change', handleContainerSizeChange);
        }
        if (applyCustomSizeBtn) {
            applyCustomSizeBtn.addEventListener('click', applyCustomSize);
        }

        // Window resize listener for auto-sizing (debounced)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (containerSizeMode === 'auto') {
                    updateContainerForAutoSize();
                } else {
                    // For non-auto modes, just fit the canvas to the container when window resizes.
                    fitToPage();
                }
            }, 150); // Debounce resize events
        });

        // Feedback modal listeners
        if (feedbackCloseBtn) {
            feedbackCloseBtn.addEventListener('click', closeFeedbackModal);
        }

        if (feedbackModal) {
            feedbackModal.addEventListener('click', (e) => {
                if (e.target === feedbackModal) {
                    closeFeedbackModal();
                }
            });
        }

        // Emoji rating listeners
        emojiButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove selected class from all buttons
                emojiButtons.forEach(b => b.classList.remove('selected'));
                // Add selected class to clicked button
                e.target.classList.add('selected');
                selectedRating = parseInt(e.target.dataset.rating);
            });
        });

        // Feedback submit listener
        if (feedbackSubmitBtn) {
            feedbackSubmitBtn.addEventListener('click', submitFeedback);
        }

        // Context menu listeners
        document.addEventListener('click', hideContextMenu);
        panelContextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = e.target.dataset.action;
            if (action) handleContextMenuAction(action);
        });

        // Figure caption listener
        figureCaptionEditor.addEventListener('input', () => {
            if (activeFigureIndex >= 0 && project.figures[activeFigureIndex]) {
                project.figures[activeFigureIndex].caption = figureCaptionEditor.value;
                // Debounced save to avoid excessive history entries
                clearTimeout(figureCaptionEditor._saveTimeout);
                figureCaptionEditor._saveTimeout = setTimeout(() => {
                    saveState();
                }, 1000);
            }
        });

        // Figure caption Save button
        const saveCaptionBtn = document.getElementById('save-caption-btn');
        if (saveCaptionBtn) {
            saveCaptionBtn.addEventListener('click', () => {
                if (activeFigureIndex >= 0 && project.figures[activeFigureIndex]) {
                    project.figures[activeFigureIndex].caption = figureCaptionEditor.value;
                    saveState();

                    // Visual feedback
                    const originalText = saveCaptionBtn.textContent;
                    saveCaptionBtn.textContent = 'Saved!';
                    saveCaptionBtn.style.background = 'linear-gradient(145deg, #20c997, #17a2b8)';
                    setTimeout(() => {
                        saveCaptionBtn.textContent = originalText;
                        saveCaptionBtn.style.background = '';
                    }, 1500);
                }
            });
        }

        // Figure caption Clear button
        const clearCaptionBtn = document.getElementById('clear-caption-btn');
        if (clearCaptionBtn) {
            clearCaptionBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the figure legend?')) {
                    figureCaptionEditor.value = '';
                    if (activeFigureIndex >= 0 && project.figures[activeFigureIndex]) {
                        project.figures[activeFigureIndex].caption = '';
                        saveState();
                    }
                }
            });
        }

        // Preview toggle functionality (collapse/expand only)
        if (previewToggleBtn && sidebarPreviewContainer) {
            previewToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = sidebarPreviewContainer.classList.contains('collapsed');

                if (isCollapsed) {
                    sidebarPreviewContainer.classList.remove('collapsed');
                    // Update mini preview when expanding
                    setTimeout(() => {
                        if (!sidebarPreviewContainer.classList.contains('collapsed')) {
                            lastUpdateHash = null; // Force update
                            updateMiniPreview();
                        }
                    }, 100);
                } else {
                    sidebarPreviewContainer.classList.add('collapsed');
                }
            });
        }

            // Add resize observer to update canvas when preview is resized
            if (window.ResizeObserver) {
                let resizeTimeout = null;
                let lastResizeHash = null;

                const resizeObserver = new ResizeObserver(entries => {
                    // Debounce resize updates
                    if (resizeTimeout) {
                        clearTimeout(resizeTimeout);
                    }

                    resizeTimeout = setTimeout(() => {
                        for (let entry of entries) {
                            const rect = entry.contentRect;
                            const currentResizeHash = `${entry.target.id}-${Math.round(rect.width)}-${Math.round(rect.height)}`;

                            // Only update if size actually changed significantly
                            if (currentResizeHash === lastResizeHash) {
                                continue;
                            }
                            lastResizeHash = currentResizeHash;

                            if (entry.target === sidebarPreviewContainer) {

                                // Update preview canvas if expanded
                                if (!sidebarPreviewContainer.classList.contains('collapsed') && 
                                    rect.width > 100 && rect.height > 100) {
                                    lastUpdateHash = null;
                                    updateMiniPreview();
                                }
                            } else if (entry.target === editModalPreview) {
                                // Only enforce collapse state constraints when collapsed
                                if (editModalPreview.classList.contains('collapsed')) {
                                    editModalPreview.style.height = '50px';
                                    editModalPreview.style.minHeight = '50px';
                                    editModalPreview.style.maxHeight = '50px';
                                } else {
                                    // When expanded, completely avoid overriding CSS resize properties
                                    // Only trigger canvas update without modifying dimensions
                                    if (rect.width > 50 && rect.height > 50) {
                                        // Force update for resize without touching style properties
                                        lastUpdateHash = null;
                                        updateMiniPreview();
                                    }
                                }
                            }
                        }
                    }, 100); // Faster response for better user experience
                });

                if (sidebarPreviewContainer) {
                    resizeObserver.observe(sidebarPreviewContainer);
                }
                if (editModalPreview) {
                    resizeObserver.observe(editModalPreview);
                }
            }

        // Annotation history listeners
        if (undoAnnotationBtn) undoAnnotationBtn.addEventListener('click', undoAnnotation);
        if (redoAnnotationBtn) redoAnnotationBtn.addEventListener('click', redoAnnotation);

        // Edit modal preview toggle functionality
        if (editPreviewToggleBtn && editModalPreview) {
            const toggleEditPreview = (e) => {
                e.stopPropagation();
                const isCollapsed = editModalPreview.classList.contains('collapsed');

                if (isCollapsed) {
                    editModalPreview.classList.remove('collapsed');
                    editModalPreview.classList.add('expanded');
                    // Clear forced constraints when expanding
                    editModalPreview.style.height = '';
                    editModalPreview.style.minHeight = '';
                    editModalPreview.style.maxHeight = '';
                } else {
                    editModalPreview.classList.add('collapsed');
                    editModalPreview.classList.remove('expanded');
                    // Force height to 50px when collapsing
                    editModalPreview.style.height = '50px';
                    editModalPreview.style.minHeight = '50px';
                    editModalPreview.style.maxHeight = '50px';
                }
            };

            editPreviewToggleBtn.addEventListener('click', toggleEditPreview);
        }

    // --- 9. PANEL EDITING LOGIC ---
    function openEditModal(panel) {
        if (isEditModalOpen || !panel || !panel.pristineSrc) {
            return;
        }
        isEditModalOpen = true;

        currentlyEditingPanel = panel;
        brightnessSlider.value = panel.edits.brightness;
        brightnessValue.textContent = panel.edits.brightness + '%';
        contrastSlider.value = panel.edits.contrast;
        contrastValue.textContent = panel.edits.contrast + '%';
        rotateSlider.value = panel.edits.rotation || 0;
        rotateValue.textContent = (panel.edits.rotation || 0) + '°';

        // Set span values
        const span = panel.edits.layoutSpan || { colspan: 1, rowspan: 1 };
        panelColspanInput.value = span.colspan;
        panelRowspanInput.value = span.rowspan;

        // Initialize greyscale button state
        const currentGreyscale = panel.edits.greyscale || 0;
        if (currentGreyscale === 100) {
            greyscaleBtn.classList.add('active');
            greyscaleBtn.textContent = 'Remove Greyscale';
        } else {
            greyscaleBtn.classList.remove('active');
            greyscaleBtn.textContent = 'Toggle Greyscale';
        }

        // Update layout span controls visibility and current layout indicator
        updateLayoutSpanControls();

        editImage.onerror = () => {
            alert("Error: The panel image could not be loaded for editing. It may be corrupt.");
            closeEditModal();
        };

        editImage.onload = () => {
            editCanvas.width = editImage.width;
            editCanvas.height = editImage.height;
            // FIX: Initialize cropBox to null if no existing crop, allowing new drag-to-draw
            cropBox = panel.edits.crop ? { ...panel.edits.crop } : null; //

            // Reset annotation state and hide styling options
            selectedAnnotation = null;
            hideAnnotationStylingOptions();

            // Reset active tool to crop (internal state) but don't show visual selection
            activeAnnotationTool = 'crop';
            document.querySelectorAll('#annotation-tools .tool-btn').forEach(btn => {
                btn.classList.remove('active-tool');
            });
            // Don't add active-tool class to any button by default

            // NEW: Initialize annotation history
            resetAnnotationHistory();

            // Update layout span controls when modal opens
            updateLayoutSpanControls();

            requestAnimationFrame(() => {
                redrawEditCanvas();
            });

            // Initialize edit modal preview - start expanded by default
            if (editModalPreview) {
                // Start expanded by default
                editModalPreview.classList.remove('collapsed');
                editModalPreview.classList.add('expanded');
                // Clear any forced constraints
                editModalPreview.style.height = '';
                editModalPreview.style.minHeight = '';
                editModalPreview.style.maxHeight = '';
            }

            editModal.classList.remove('hidden');

            // Add scroll support
            addEditControlsScrollSupport();

            // DEBUG: Check scrollbar issue
            setTimeout(() => {
                const editControls = document.getElementById('edit-controls-panel');
                if (editControls) {
                    console.log('=== SCROLLBAR DEBUG INFO ===');
                    console.log('Edit controls element:', editControls);
                    console.log('Computed styles:');
                    console.log('- overflow-y:', getComputedStyle(editControls).overflowY);
                    console.log('- overflow-x:', getComputedStyle(editControls).overflowX);
                    console.log('- height:', getComputedStyle(editControls).height);
                    console.log('- max-height:', getComputedStyle(editControls).maxHeight);
                    console.log('- scrollHeight:', editControls.scrollHeight);
                    console.log('- clientHeight:', editControls.clientHeight);
                    console.log('- offsetHeight:', editControls.offsetHeight);
                    console.log('- scrollTop:', editControls.scrollTop);
                    console.log('- scrollTopMax:', editControls.scrollTopMax);

                    // Check if content overflows
                    const hasOverflow = editControls.scrollHeight > editControls.clientHeight;
                    console.log('Content overflows:', hasOverflow);
                    console.log('Overflow amount:', editControls.scrollHeight - editControls.clientHeight);

                    // Check parent modal dimensions
                    const modalContent = editControls.closest('.modal-content');
                    if (modalContent) {
                        console.log('Modal content height:', getComputedStyle(modalContent).height);
                        console.log('Modal content max-height:', getComputedStyle(modalContent).maxHeight);
                    }

                    // Force scrollbar to appear for testing
                    if (!hasOverflow) {
                        console.log('No overflow detected - adding test content to force scrollbar');
                        const testDiv = document.createElement('div');
                        testDiv.style.height = '1000px';
                        testDiv.style.backgroundColor = 'rgba(255,0,0,0.1)';
                        testDiv.textContent = 'TEST CONTENT FOR SCROLLBAR';
                        editControls.appendChild(testDiv);

                        // Check again after adding test content
                        setTimeout(() => {
                            console.log('After adding test content:');
                            console.log('- scrollHeight:', editControls.scrollHeight);
                            console.log('- clientHeight:', editControls.clientHeight);
                            console.log('- Content overflows:', editControls.scrollHeight > editControls.clientHeight);
                        }, 100);
                    }
                }

                lastUpdateHash = null; // Force update
                updateMiniPreview();
            }, 100);
        };
        editImage.src = panel.pristineSrc;
    }

    function closeEditModal() {
        // Restore original image if preview was active (from a previous implementation)
        // This was for live preview on main canvas, which is now disabled.
        // If this logic is tied to _originalImage, it might not be needed or might cause issues.
        // Keeping it commented out or verifying its purpose is key.
        /* if (currentlyEditingPanel && currentlyEditingPanel._originalImage) {
            currentlyEditingPanel.image = currentlyEditingPanel._originalImage;
            delete currentlyEditingPanel._originalImage;
            renderFigure();
        } */

        editModal.classList.add('hidden');
        isEditModalOpen = false;
        currentlyEditingPanel = null;
        // FIX: Ensure cropBox is set to null when closing modal for a clean state
        cropBox = null; //
        cropInteractionMode = null;
        cropStartPos = null;
        cropStartBox = null;
        selectedAnnotation = null;
        hideAnnotationStylingOptions();
        editImage.src = "";
        editImage.onerror = null;
        editImage.onload = null;

        // Cancel any pending preview updates (was for main canvas preview)
        if (previewUpdateRAF) {
            cancelAnimationFrame(previewUpdateRAF);
            previewUpdateRAF = null;
        }
    }

    // NEW: Functions for showing/hiding annotation styling options
    function showAnnotationStylingOptions(annotationType) {
        if (annotationStylingOptions) {
            annotationStylingOptions.classList.remove('hidden-by-default');

            const colorControl = document.getElementById('annotation-color-control');
            const lineWidthControl = document.getElementById('annotation-linewidth-control');
            const fontSizeControl = document.getElementById('annotation-fontsize-control');
            const fontFamilyControl = document.getElementById('annotation-font-family-control');
            const fontStyleControl = document.getElementById('annotation-font-style-control');

            // Hide all controls first to ensure clean reset
            if (colorControl) colorControl.style.display = 'none';
            if (lineWidthControl) lineWidthControl.style.display = 'none';
            if (fontSizeControl) fontSizeControl.style.display = 'none';
            if (fontFamilyControl) fontFamilyControl.style.display = 'none';
            if (fontStyleControl) fontStyleControl.style.display = 'none';

            // Show relevant controls based on annotation type
            if (annotationType === 'text') {
                if (colorControl) colorControl.style.display = 'block';
                if (fontSizeControl) fontSizeControl.style.display = 'block';
                if (fontFamilyControl) fontFamilyControl.style.display = 'block';
                if (fontStyleControl) fontStyleControl.style.display = 'block';
            } else if (annotationType === 'arrow' || annotationType === 'rect') {
                if (colorControl) colorControl.style.display = 'block';
                if (lineWidthControl) lineWidthControl.style.display = 'block';
            }
        }
    }

    function hideAnnotationStylingOptions() {
        if (annotationStylingOptions) {
            annotationStylingOptions.classList.add('hidden-by-default');

            // Explicitly hide all individual controls for consistency
            const colorControl = document.getElementById('annotation-color-control');
            const lineWidthControl = document.getElementById('annotation-linewidth-control');
            const fontSizeControl = document.getElementById('annotation-fontsize-control');
            const fontFamilyControl = document.getElementById('annotation-font-family-control');
            const fontStyleControl = document.getElementById('annotation-font-style-control');

            if (colorControl) colorControl.style.display = 'none';
            if (lineWidthControl) lineWidthControl.style.display = 'none';
            if (fontSizeControl) fontSizeControl.style.display = 'none';
            if (fontFamilyControl) fontFamilyControl.style.display = 'none';
            if (fontStyleControl) fontStyleControl.style.display = 'none';
        }
    }

    // NEW: Populate annotation controls based on selected annotation
    function populateAnnotationControls(annotation) {
        if (!annotation) return;

        annotationColorInput.value = annotation.color || '#FF0000';

        if (annotation.type === 'text') {
            annotationFontSizeInput.value = annotation.size || 16;
            annotationFontFamilySelect.value = annotation.fontFamily || 'Arial';
            // Set bold/italic controls based on annotation properties
            if (annotationBoldBtn) {
                annotationBoldBtn.classList.toggle('active', annotation.fontWeight === 'bold');
            }
            if (annotationItalicBtn) {
                annotationItalicBtn.classList.toggle('active', annotation.fontStyle === 'italic');
            }
        } else {
            annotationLineWidthInput.value = annotation.lineWidth || 2;
        }
    }

    // --- START: PASTE THE HELPER FUNCTIONS HERE ---
    function drawAnnotations(ctx, panel) {
        if (!panel || !panel.edits.annotations) return;

        // Draw saved annotations
        panel.edits.annotations.forEach((a, index) => {
            ctx.strokeStyle = a.color;
            ctx.fillStyle = a.color;
            ctx.lineWidth = a.lineWidth;

            // Highlight selected annotation
            if (selectedAnnotation === index) {
                ctx.strokeStyle = '#ff0000';
                ctx.lineWidth = Math.max(a.lineWidth, 3);
            }

            switch (a.type) {
                case 'rect':
                    ctx.strokeRect(a.x1, a.y1, a.x2 - a.x1, a.y2 - a.y1);
                    // Draw selection handles for selected rectangle
                    if (selectedAnnotation === index) {
                        drawSelectionHandles(ctx, a.x1, a.y1, a.x2, a.y2);
                    }
                    break;
                case 'arrow':
                    drawArrow(ctx, a.x1, a.y1, a.x2, a.y2);
                    // Draw selection handles for selected arrow
                    if (selectedAnnotation === index) {
                        drawSelectionHandles(ctx, a.x1, a.y1, a.x2, a.y2, true);
                    }
                    break;
                case 'text':
                    const fontFamily = a.fontFamily || 'Arial';
                    const fontWeight = a.fontWeight || 'normal';
                    const fontStyle = a.fontStyle || 'normal';
                    ctx.font = `${fontStyle} ${fontWeight} ${a.size}px ${fontFamily}`;
                    ctx.textBaseline = 'top';
                    ctx.fillText(a.text, a.x, a.y);
                    // Draw selection handles for selected text
                    if (selectedAnnotation === index) {
                        const textMetrics = ctx.measureText(a.text);
                        drawSelectionHandles(ctx, a.x, a.y, a.x + textMetrics.width, a.y + a.size);
                    }
                    break;
            }
        });

        // Draw the annotation currently being created
        if (currentAnnotation) {
            ctx.strokeStyle = currentAnnotation.color;
            ctx.lineWidth = currentAnnotation.lineWidth;
            if (currentAnnotation.type === 'rect') {
                ctx.strokeRect(currentAnnotation.x1, currentAnnotation.y1, currentAnnotation.x2 - currentAnnotation.x1, currentAnnotation.y2 - currentAnnotation.y1);
            } else if (currentAnnotation.type === 'arrow') {
                drawArrow(ctx, currentAnnotation.x1, currentAnnotation.y1, currentAnnotation.x2, currentAnnotation.y2);
            }
        }
    }

    // NEW: Function to draw selection handles
    function drawSelectionHandles(ctx, x1, y1, x2, y2, isLine = false) {
        const handleSize = 6;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        if (isLine) {
            // For lines/arrows, show handles at both ends
            ctx.fillRect(x1 - handleSize/2, y1 - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(x1 - handleSize/2, y1 - handleSize/2, handleSize, handleSize);
            ctx.fillRect(x2 - handleSize/2, y2 - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(x2 - handleSize/2, y2 - handleSize/2, handleSize, handleSize);
        } else {
            // For rectangles and text, show corner handles
            const corners = [
                [x1, y1], [x2, y1], [x1, y2], [x2, y2]
            ];
            corners.forEach(([x, y]) => {
                ctx.fillRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
                ctx.strokeRect(x - handleSize/2, y - handleSize/2, handleSize, handleSize);
            });
        }
    }

    // NEW: Function to draw panel annotations on main canvas
    function drawPanelAnnotationsOnMainCanvas(ctx, panel) {
        if (!panel.edits.annotations || panel.edits.annotations.length === 0) return;

        ctx.save();

        // Calculate scaling factors from original panel size to display size
        const scaleX = panel.displayWidth / panel.originalWidth;
        const scaleY = panel.displayHeight / panel.originalHeight;

        // Set clipping area to panel bounds
        ctx.beginPath();
        ctx.rect(panel.imageX, panel.imageY, panel.displayWidth, panel.displayHeight);
        ctx.clip();

        panel.edits.annotations.forEach(annotation => {
            ctx.strokeStyle = annotation.color;
            ctx.fillStyle = annotation.color;
            ctx.lineWidth = annotation.lineWidth || 2;

            switch (annotation.type) {
                case 'rect':
                    const rectX1 = panel.imageX + (annotation.x1 * scaleX);
                    const rectY1 = panel.imageY + (annotation.y1 * scaleY);
                    const rectX2 = panel.imageX + (annotation.x2 * scaleX);
                    const rectY2 = panel.imageY + (annotation.y2 * scaleY);
                    ctx.strokeRect(rectX1, rectY1, rectX2 - rectX1, rectY2 - rectY1);
                    break;

                case 'arrow':
                    const arrowX1 = panel.imageX + (annotation.x1 * scaleX);
                    const arrowY1 = panel.imageY + (annotation.y1 * scaleY);
                    const arrowX2 = panel.imageX + (annotation.x2 * scaleX);
                    const arrowY2 = panel.imageY + (annotation.y2 * scaleY);
                    drawArrow(ctx, arrowX1, arrowY1, arrowX2, arrowY2);
                    break;

                case 'text':
                    const textX = panel.imageX + (annotation.x * scaleX);
                    const textY = panel.imageY + (annotation.y * scaleY);
                    const scaledFontSize = (annotation.size || 16) * Math.min(scaleX, scaleY);
                    const fontFamily = annotation.fontFamily || 'Arial';
                    const fontWeight = annotation.fontWeight || 'normal';
                    const fontStyle = annotation.fontStyle || 'normal';
                    ctx.font = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}`;
                    ctx.textBaseline = 'top';
                    ctx.fillText(annotation.text, textX, textY);
                    break;
            }
        });

        ctx.restore();
    }

    // NEW: Function to get annotation at mouse position
    function getAnnotationAt(mouseX, mouseY, annotations) {
        for (let i = annotations.length - 1; i >= 0; i--) {
            const a = annotations[i];
            switch (a.type) {
                case 'rect':
                    if (mouseX >= Math.min(a.x1, a.x2) && mouseX <= Math.max(a.x1, a.x2) &&
                        mouseY >= Math.min(a.y1, a.y2) && mouseY <= Math.max(a.y1, a.y2)) {
                        return i;
                    }
                    break;
                case 'arrow':
                    // Check if click is near the line (with some tolerance)
                    const tolerance = 10;
                    const dist = distanceToLine(mouseX, mouseY, a.x1, a.y1, a.x2, a.y2);
                    if (dist <= tolerance) {
                        return i;
                    }
                    break;
                case 'text':
                    // Simple bounding box check for text (approximation, actual text width might vary)
                    // It's better to use ctx.measureText if ctx and font are available and set
                    // For now, use an approximation or ensure redrawEditCanvas passes correct ctx and font
                    // This estimate needs editCtx context from redrawEditCanvas for accurate calculation
                    const tempCtxForText = editCanvas.getContext('2d'); // Get a temporary context
                    tempCtxForText.font = `${a.fontStyle || 'normal'} ${a.fontWeight || 'normal'} ${a.size}px ${a.fontFamily || 'Arial'}`;
                    const textMetrics = tempCtxForText.measureText(a.text);
                    const textWidth = textMetrics.width;
                    const textHeight = a.size; // Approximated height for click detection

                    if (mouseX >= a.x && mouseX <= a.x + textWidth &&
                        mouseY >= a.y && mouseY <= a.y + textHeight) {
                        return i;
                    }
                    break;
            }
        }
        return -1;
    }

    // NEW: Helper for distance to line (for arrow selection)
    function distanceToLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function drawArrow(ctx, fromx, fromy, tox, toy) {
        const headlen = 10; // length of head in pixels
        const dx = tox - fromx;
        const dy = toy - fromy;
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    }

    let previewUpdateRAF; //
    function redrawEditCanvas() {
        if (!editImage.src) return;

        const edits = currentlyEditingPanel.edits;
        editCtx.clearRect(0, 0, editCanvas.width, editCanvas.height);

        // Apply filters
        editCtx.filter = `brightness(${brightnessSlider.value}%) contrast(${contrastSlider.value}%) grayscale(${edits.greyscale || 0}%)`;

        // Save context for transformation
        editCtx.save();

        // Translate to center of canvas and rotate
        editCtx.translate(editCanvas.width / 2, editCanvas.height / 2);
        editCtx.rotate((rotateSlider.value || 0) * Math.PI / 180);
        editCtx.translate(-editCanvas.width / 2, -editCanvas.height / 2);

        // Draw the image and restore context
        editCtx.drawImage(editImage, 0, 0, editCanvas.width, editCanvas.height);
        editCtx.restore();

        // Reset filter for drawing annotations and crop box
        editCtx.filter = 'none';

        drawAnnotations(editCtx, currentlyEditingPanel);
        // FIX: Only draw cropBox and overlay if cropBox exists
        if (cropBox) { //
            drawCropBox(editCtx, cropBox); //
        }

        // Trigger mini preview update for edit modal
        if (isEditModalOpen) {
            lastUpdateHash = null; // Force update
            updateMiniPreview();
        }
    }

    function drawCropBox(ctx, box) {
        ctx.save();

        // Normalize box dimensions (handle negative width/height from dragging up/left)
        const normalizedBox = {
            x: Math.min(box.x, box.x + box.width),
            y: Math.min(box.y, box.y + box.height),
            width: Math.abs(box.width),
            height: Math.abs(box.height)
        };

        // Draw the full overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Use globalCompositeOperation to "punch a hole" in the overlay for the crop area
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillRect(normalizedBox.x, normalizedBox.y, normalizedBox.width, normalizedBox.height);

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';

        // Draw crop box border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(normalizedBox.x, normalizedBox.y, normalizedBox.width, normalizedBox.height);

        // Draw resize handles
        const handleSize = 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;

        // Corner handles
        const handles = [
            { x: normalizedBox.x, y: normalizedBox.y }, // top-left
            { x: normalizedBox.x + normalizedBox.width, y: normalizedBox.y }, // top-right
            { x: normalizedBox.x, y: normalizedBox.y + normalizedBox.height }, // bottom-left
            { x: normalizedBox.x + normalizedBox.width, y: normalizedBox.y + normalizedBox.height } // bottom-right
        ];

        handles.forEach(handle => {
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        });

        ctx.restore();
    }

    // `getCropBoxInteraction` is fine. No changes needed.
    function getCropBoxInteraction(mouseX, mouseY, box) {
        const handleSize = 8;
        const tolerance = handleSize / 2;

        // Normalize box dimensions
        const normalizedBox = {
            x: Math.min(box.x, box.x + box.width),
            y: Math.min(box.y, box.y + box.height),
            width: Math.abs(box.width),
            height: Math.abs(box.height)
        };

        // Check corner handles
        const corners = [
            { type: 'nw-resize', x: normalizedBox.x, y: normalizedBox.y },
            { type: 'ne-resize', x: normalizedBox.x + normalizedBox.width, y: normalizedBox.y },
            { type: 'sw-resize', x: normalizedBox.x, y: normalizedBox.y + normalizedBox.height },
            { type: 'se-resize', x: normalizedBox.x + normalizedBox.width, y: normalizedBox.y + normalizedBox.height }
        ];

        for (let corner of corners) {
            if (Math.abs(mouseX - corner.x) <= tolerance && Math.abs(mouseY - corner.y) <= tolerance) {
                return corner.type;
            }
        }

        // Check if inside crop box (for moving)
        if (mouseX >= normalizedBox.x && mouseX <= normalizedBox.x + normalizedBox.width && 
            mouseY >= normalizedBox.y && mouseY <= normalizedBox.y + normalizedBox.height) {
            return 'move';
        }

        return 'crop'; // Default crop behavior if no specific interaction detected
    }

    function generateEditedImage(sourceUrl, edits, scale = 1) {
        return new Promise((resolve, reject) => {
            const sourceImage = new Image();
            sourceImage.onload = () => {
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                const crop = edits.crop || { x: 0, y: 0, width: sourceImage.width, height: sourceImage.height };

                // Ensure crop dimensions are valid and positive
                const validCrop = {
                    x: Math.max(0, Math.min(crop.x, sourceImage.width)),
                    y: Math.max(0, Math.min(crop.y, sourceImage.height)),
                    width: Math.max(1, Math.min(crop.width, sourceImage.width - crop.x)),
                    height: Math.max(1, Math.min(crop.height, sourceImage.height - crop.y))
                };

                // Set canvas to cropped dimensions with scaling
                tempCanvas.width = validCrop.width * scale;
                tempCanvas.height = validCrop.height * scale;

                // Apply filters
                const greyscale = edits.greyscale || 0;
                tempCtx.filter = `brightness(${edits.brightness}%) contrast(${edits.contrast}%) grayscale(${greyscale}%)`;

                // Save context, translate, rotate, and draw
                tempCtx.save();
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate((edits.rotation || 0) * Math.PI / 180);
                tempCtx.drawImage(sourceImage,
                    validCrop.x, validCrop.y, validCrop.width, validCrop.height,
                    -tempCanvas.width / 2, -tempCanvas.height / 2, tempCanvas.width, tempCanvas.height
                );
                tempCtx.restore();

                // Reset filter and draw annotations if they exist
                tempCtx.filter = 'none';
                if (edits.annotations && edits.annotations.length > 0) {
                    edits.annotations.forEach(annotation => {
                        tempCtx.strokeStyle = annotation.color;
                        tempCtx.fillStyle = annotation.color;
                        tempCtx.lineWidth = (annotation.lineWidth || 2) * scale;

                        // Adjust annotation coordinates for crop offset and scale
                        const adjustedX = (annotation.x - validCrop.x) * scale;
                        const adjustedY = (annotation.y - validCrop.y) * scale;
                        const adjustedX1 = (annotation.x1 - validCrop.x) * scale;
                        const adjustedY1 = (annotation.y1 - validCrop.y) * scale;
                        const adjustedX2 = (annotation.x2 - validCrop.x) * scale;
                        const adjustedY2 = (annotation.y2 - validCrop.y) * scale;

                        switch (annotation.type) {
                            case 'rect':
                                tempCtx.strokeRect(adjustedX1, adjustedY1, adjustedX2 - adjustedX1, adjustedY2 - adjustedY1);
                                break;
                            case 'arrow':
                                drawArrow(tempCtx, adjustedX1, adjustedY1, adjustedX2, adjustedY2);
                                break;
                            case 'text':
                                const fontFamily = annotation.fontFamily || 'Arial';
                                const fontWeight = annotation.fontWeight || 'normal';
                                const fontStyle = annotation.fontStyle || 'normal';
                                const fontSize = (annotation.size || 16) * scale;
                                tempCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
                                tempCtx.textBaseline = 'top';
                                tempCtx.fillText(annotation.text, adjustedX, adjustedY);
                                break;
                        }
                    });
                }

                resolve(tempCanvas.toDataURL('image/png'));
            };
            sourceImage.onerror = reject;
            sourceImage.src = sourceUrl;
        });
    }

    function setModalControlsDisabled(disabled) {
        applyEditBtn.disabled = disabled;
        cancelEditBtn.disabled = disabled;
        brightnessSlider.disabled = disabled;
        contrastSlider.disabled = disabled;
        resetCropBtn.disabled = disabled;
        resetBrightnessBtn.disabled = disabled;
        resetContrastBtn.disabled = disabled;
        resetRotateBtn.disabled = disabled;
        greyscaleBtn.disabled = disabled;
    }

    function attachEditModalListeners() {
        figureCanvas.addEventListener('dblclick', (e) => {
            if (!project.figures || !project.figures[activeFigureIndex]) return;
            const mousePos = getMousePos(figureCanvas, e);
            const clickedPanel = [...project.figures[activeFigureIndex].panels].reverse().find(panel => isMouseOverPanel(mousePos, panel));
            if (clickedPanel) {
                openEditModal(clickedPanel);
            }
        });

        // --- START: NEW ANNOTATION TOOL LISTENER ---
        annotationTools.addEventListener('click', (e) => {
            const t = e.target.closest('.tool-btn')?.dataset.tool;
            annotationStylingOptions.classList.toggle(
                 'hidden-by-default',
                 t === 'crop' || !t      // hide only for crop / nothing picked
            );
        });

        clearAnnotationsBtn.addEventListener('click', () => {
            if (currentlyEditingPanel && confirm("Are you sure you want to remove all annotations for this panel?")) {
                currentlyEditingPanel.edits.annotations = [];
                selectedAnnotation = null;
                hideAnnotationStylingOptions();
                saveAnnotationState(); // NEW: Save to annotation history
                redrawEditCanvas();
            }
        });

        // Annotation control change listeners
        annotationColorInput.addEventListener('change', () => {
            if (selectedAnnotation !== null && currentlyEditingPanel) {
                currentlyEditingPanel.edits.annotations[selectedAnnotation].color = annotationColorInput.value;
                redrawEditCanvas();
            }
        });

        annotationLineWidthInput.addEventListener('change', () => {
            if (selectedAnnotation !== null && currentlyEditingPanel) {
                currentlyEditingPanel.edits.annotations[selectedAnnotation].lineWidth = parseInt(annotationLineWidthInput.value);
                redrawEditCanvas();
            }
        });

        annotationFontSizeInput.addEventListener('change', () => {
            if (selectedAnnotation !== null && currentlyEditingPanel) {
                const annotation = currentlyEditingPanel.edits.annotations[selectedAnnotation];
                if (annotation.type === 'text') {
                    annotation.size = parseInt(annotationFontSizeInput.value);
                    redrawEditCanvas();
                }
            }
        });

        annotationFontFamilySelect.addEventListener('change', () => {
            if (selectedAnnotation !== null && currentlyEditingPanel) {
                const annotation = currentlyEditingPanel.edits.annotations[selectedAnnotation];
                if (annotation.type === 'text') {
                    annotation.fontFamily = annotationFontFamilySelect.value;
                    redrawEditCanvas();
                }
            }
        });

        // Bold/Italic button event listeners
        if (annotationBoldBtn) { // Check if elements exist before attaching listeners
            annotationBoldBtn.addEventListener('click', () => {
                annotationBoldBtn.classList.toggle('active');
                if (selectedAnnotation !== null && currentlyEditingPanel) {
                    const annotation = currentlyEditingPanel.edits.annotations[selectedAnnotation];
                    if (annotation.type === 'text') {
                        annotation.fontWeight = annotationBoldBtn.classList.contains('active') ? 'bold' : 'normal';
                        redrawEditCanvas();
                    }
                }
            });
        }
        if (annotationItalicBtn) { // Check if elements exist before attaching listeners
            annotationItalicBtn.addEventListener('click', () => {
                annotationItalicBtn.classList.toggle('active');
                if (selectedAnnotation !== null && currentlyEditingPanel) {
                    const annotation = currentlyEditingPanel.edits.annotations[selectedAnnotation];
                    if (annotation.type === 'text') {
                        annotation.fontStyle = annotationItalicBtn.classList.contains('active') ? 'italic' : 'normal';
                        redrawEditCanvas();
                    }
                }
            });
        }

        // Add keyboard support for annotation editing
        editModal.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && selectedAnnotation !== null && currentlyEditingPanel) {
                currentlyEditingPanel.edits.annotations.splice(selectedAnnotation, 1);
                selectedAnnotation = null;
                saveAnnotationState(); // NEW: Save to annotation history
                redrawEditCanvas();
                e.preventDefault();
            }
        });

        // Remove any existing listeners to prevent duplication
        brightnessSlider.removeEventListener('input', brightnessSlider._inputHandler);
        contrastSlider.removeEventListener('input', contrastSlider._inputHandler);
        rotateSlider.removeEventListener('input', rotateSlider._inputHandler);

        // Create and store new handlers
        brightnessSlider._inputHandler = (e) => {
            brightnessValue.textContent = e.target.value + '%';
            redrawEditCanvas();
        };
        contrastSlider._inputHandler = (e) => {
            contrastValue.textContent = e.target.value + '%';
            redrawEditCanvas();
        };
        rotateSlider._inputHandler = (e) => {
            rotateValue.textContent = e.target.value + '°';
            redrawEditCanvas();
        };

        // Add the new listeners
        brightnessSlider.addEventListener('input', brightnessSlider._inputHandler);
        contrastSlider.addEventListener('input', contrastSlider._inputHandler);
        rotateSlider.addEventListener('input', rotateSlider._inputHandler);

        resetBrightnessBtn.addEventListener('click', () => {
            brightnessSlider.value = 100;
            brightnessValue.textContent = '100%';
            redrawEditCanvas();
        });

        resetContrastBtn.addEventListener('click', () => {
            contrastSlider.value = 100;
            contrastValue.textContent = '100%';
            redrawEditCanvas();
        });

        resetRotateBtn.addEventListener('click', () => {
            rotateSlider.value = 0;
            rotateValue.textContent = '0°';
            redrawEditCanvas();
        });

        // FIX: Greyscale button listener
        greyscaleBtn.addEventListener('click', () => {
            if (!currentlyEditingPanel) return;
            const currentGreyscale = currentlyEditingPanel.edits.greyscale || 0;
            currentlyEditingPanel.edits.greyscale = (currentGreyscale === 100) ? 0 : 100;

            // Update button visual state
            if (currentlyEditingPanel.edits.greyscale === 100) {
                greyscaleBtn.classList.add('active');
                greyscaleBtn.textContent = 'Remove Greyscale';
            } else {
                greyscaleBtn.classList.remove('active');
                greyscaleBtn.textContent = 'Toggle Greyscale';
            }

            redrawEditCanvas();
        });

        resetCropBtn.addEventListener('click', () => {
            // FIX: Set cropBox to null, not a full canvas box, so new crop can be drawn
            cropBox = null; //
            cropInteractionMode = null; //
            redrawEditCanvas();
        });
        cancelEditBtn.addEventListener('click', closeEditModal);

        applyEditBtn.addEventListener('click', async () => {
            if (!currentlyEditingPanel) return;
            setModalControlsDisabled(true);
            applyEditBtn.textContent = "Applying...";

            const panel = currentlyEditingPanel;
            const activeFigure = project.figures[activeFigureIndex]; // Get activeFigure reference

            // If the user manually applies edits while in a grid-compatible 'auto' layout,
            // lock in that grid layout to preserve manual span settings.
            if (activeFigure.settings.layout === 'auto' && activeFigure.effectiveLayout && activeFigure.effectiveLayout.startsWith('grid')) {
                console.log(`User is applying edits, switching layout from 'auto' to '${activeFigure.effectiveLayout}' to preserve custom spans.`);
                activeFigure.settings.layout = activeFigure.effectiveLayout;
                updateLayoutButtonSelection(activeFigure.settings.layout);
            }

            panel.edits.brightness = brightnessSlider.value;
            panel.edits.contrast = contrastSlider.value;
            panel.edits.rotation = rotateSlider.value;
            // FIX: Ensure crop is correctly stored as null if no crop is active
            panel.edits.crop = cropBox ? { ...cropBox } : null; //
            const inputColspan = parseInt(panelColspanInput.value) || 1;
            const inputRowspan = parseInt(panelRowspanInput.value) || 1;

            panel.edits.layoutSpan = {
                colspan: inputColspan,
                rowspan: inputRowspan,
            };
            // Note: greyscale is already set on the panel object by its own button

            try {
                // Ensure annotations are 'baked into' the image if needed,
                // or ensure generateEditedImage can handle drawing them on top.
                // For now, annotations are drawn by drawAnnotations. When applying,
                // generateEditedImage gets pristineSrc and edits. The annotations
                // should be drawn *within* generateEditedImage.
                // FIX: Pass panel.edits.annotations to generateEditedImage so they can be drawn
                console.log('Applying edits to panel:', panel.id, 'Edits:', panel.edits);
                const newImageSrc = await generateEditedImage(panel.pristineSrc, panel.edits); //
                console.log('Generated new image src, length:', newImageSrc.length);
                const newImg = new Image();
                newImg.onload = () => {
                    console.log('New image loaded, dimensions:', newImg.width, 'x', newImg.height);
                    panel.image = newImg;
                    panel.originalSrc = newImageSrc; // Update originalSrc to the edited version
                    panel.originalWidth = newImg.width;
                    panel.originalHeight = newImg.height;
                    saveState();
                    // Ensure the image is fully loaded before rendering
                    requestAnimationFrame(() => {

                        // Force a complete layout recalculation by clearing any cached layout data
                        if (panel.gridPos) {
                            delete panel.gridPos; // Clear cached grid position
                        }
                        // Also clear grid positions for all panels to ensure complete recalculation
                        const activeFigure = project.figures[activeFigureIndex];
                        if (activeFigure) {
                            console.log('Current layout type:', activeFigure.settings.layout, 'Effective layout:', activeFigure.effectiveLayout);
                            if (activeFigure.panels) {
                                activeFigure.panels.forEach(p => {
                                    if (p.gridPos) {
                                        delete p.gridPos;
                                    }
                                });
                            }
                        }
                        // Force a complete re-render by clearing any cached data
                        lastUpdateHash = null;
                        // Small delay to ensure changes are fully applied
                        setTimeout(() => {
                            console.log('Final check - panel layoutSpan before render:', panel.edits.layoutSpan);
                            console.log('Panel object before renderFigure:', panel);
                            renderFigure(); // This updates the main canvas with the new panel.image and layout
                        }, 10);
                    });
                    closeEditModal();
                    // Removed setTimeout(updateMiniPreview, 10);
                };
                newImg.onerror = (error) => {
                    console.error("Failed to load edited image:", error);
                    alert("Failed to load the edited image. Please try again.");
                };
                newImg.src = newImageSrc;
            } catch (error) {
                console.error("Failed to apply edits:", error);
                alert("Could not apply edits. Please try again.");
            } finally {
                setModalControlsDisabled(false);
                applyEditBtn.textContent = "Apply Changes";
            }
        });

        // Panel span controls - only update mini preview, not main canvas
        panelColspanInput.addEventListener('change', () => {
            if (currentlyEditingPanel) {
                const newSpan = {
                    colspan: parseInt(panelColspanInput.value) || 1,
                    rowspan: parseInt(panelRowspanInput.value) || 1,
                };

                currentlyEditingPanel.edits.layoutSpan = newSpan;
                // Trigger update through hash change detection
                lastUpdateHash = null;
                updateMiniPreview();
            }
        });

        panelRowspanInput.addEventListener('change', () => {
            if (currentlyEditingPanel) {
                const newSpan = {
                    colspan: parseInt(panelColspanInput.value) || 1,
                    rowspan: parseInt(panelRowspanInput.value) || 1,
                };

                currentlyEditingPanel.edits.layoutSpan = newSpan;
                // Trigger update through hash change detection
                lastUpdateHash = null;
                updateMiniPreview();
            }
        });

        editCanvas.addEventListener('mousedown', (e) => {
            const mousePos = getMousePos(editCanvas, e);
            const mouseX = mousePos.x;
            const mouseY = mousePos.y;

            if (activeAnnotationTool === 'crop') {
                // FIX: Redefined mousedown logic for crop tool
                const interaction = cropBox ? getCropBoxInteraction(mouseX, mouseY, cropBox) : 'new-crop';
                cropInteractionMode = interaction;
                cropStartPos = { x: mouseX, y: mouseY };
                cropStartBox = cropBox ? { ...cropBox } : null; // Store current cropBox state for moves/resizes

                if (interaction.endsWith('-resize') || interaction === 'move') {
                    isCropping = true;
                    // cropBox values will be adjusted in mousemove based on interaction mode
                } else { // This is 'new-crop' (clicked outside existing box or no box)
                    isCropping = true;
                    cropBox = { x: mouseX, y: mouseY, width: 0, height: 0 }; // Initialize new crop box
                    cropInteractionMode = 'new-crop'; // Set mode to drawing a new crop
                }
            } else {
                // First, check if we clicked on an existing annotation for editing
                const clickedAnnotation = getAnnotationAt(mouseX, mouseY, currentlyEditingPanel.edits.annotations);

                if (clickedAnnotation !== -1) {
                    // Select the annotation for editing
                    selectedAnnotation = clickedAnnotation;
                    const annotation = currentlyEditingPanel.edits.annotations[clickedAnnotation];

                    // Show styling options and populate controls
                    showAnnotationStylingOptions(annotation.type);
                    populateAnnotationControls(annotation);

                    isDraggingAnnotation = true;
                    annotationDragStart = { x: mouseX, y: mouseY };

                    // If it's text and double-clicked, edit the text
                    if (annotation.type === 'text' && e.detail === 2) {
                        const newText = prompt("Edit text:", annotation.text);
                        if (newText !== null) {
                            annotation.text = newText;
                            redrawEditCanvas();
                            // Removed setTimeout(updateMiniPreview, 10);
                        }
                        return; // Prevent further mousedown processing
                    }
                    redrawEditCanvas(); // Redraw to show selection highlight
                } else if (activeAnnotationTool === 'text') {
                    const text = prompt("Enter annotation text:");
                    if (text && currentlyEditingPanel) {
                        // Get bold/italic states directly from buttons
                        const bold = annotationBoldBtn ? annotationBoldBtn.classList.contains('active') : false;
                        const italic = annotationItalicBtn ? annotationItalicBtn.classList.contains('active') : false;

                        const newAnnotation = {
                            type: 'text',
                            text: text,
                            x: mouseX,
                            y: mouseY,
                            color: annotationColorInput.value,
                            size: parseInt(annotationFontSizeInput.value),
                            fontFamily: annotationFontFamilySelect.value,
                            fontWeight: bold ? 'bold' : 'normal',
                            fontStyle: italic ? 'italic' : 'normal'
                        };
                        currentlyEditingPanel.edits.annotations.push(newAnnotation);
                        selectedAnnotation = currentlyEditingPanel.edits.annotations.length - 1; // Select the new annotation
                        showAnnotationStylingOptions('text'); // Ensure text options are visible
                        populateAnnotationControls(newAnnotation); // Populate controls with new annotation's props
                        saveAnnotationState(); // NEW: Save to annotation history
                        redrawEditCanvas();
                    }
                } else if (activeAnnotationTool === 'arrow' || activeAnnotationTool === 'rect') {
                    // Deselect any selected annotation when starting a new draw
                    selectedAnnotation = null;
                    isDrawingAnnotation = true;
                    currentAnnotation = {
                        type: activeAnnotationTool,
                        x1: mouseX, y1: mouseY,
                        x2: mouseX, y2: mouseY,
                        color: annotationColorInput.value,
                        lineWidth: parseInt(annotationLineWidthInput.value)
                    };
                }
            }
        });

        editCanvas.addEventListener('mousemove', (e) => {
            const mousePos = getMousePos(editCanvas, e);
            const mouseX = mousePos.x;
            const mouseY = mousePos.y;

            // Update cursor based on interaction
            if (activeAnnotationTool === 'crop' && cropBox && !isCropping) { // Only update cursor if not already dragging crop
                const interaction = getCropBoxInteraction(mouseX, mouseY, cropBox);
                editCanvas.style.cursor = interaction === 'move' ? 'move' : 
                                         interaction === 'crop' ? 'crosshair' : interaction;
            } else if (!isCropping && !isDrawingAnnotation && !isDraggingAnnotation) {
                // Check if hovering over an annotation
                const hoveredAnnotation = getAnnotationAt(mouseX, mouseY, currentlyEditingPanel.edits.annotations);
                editCanvas.style.cursor = hoveredAnnotation !== -1 ? 'pointer' : 'crosshair';
            } else if (isCropping || isDrawingAnnotation || isDraggingAnnotation) {
                editCanvas.style.cursor = 'grabbing'; // Show grabbing cursor when actively dragging something
            } else {
                editCanvas.style.cursor = 'default'; // Default cursor when nothing active
            }

            if (!isCropping && !isDrawingAnnotation && !isDraggingAnnotation) return;

            if (isCropping && cropInteractionMode) {
                const dx = mouseX - cropStartPos.x;
                const dy = mouseY - cropStartPos.y;

                switch (cropInteractionMode) {
                    case 'new-crop':
                        // Click-and-drag crop: draw from start point to current mouse position
                        cropBox.width = mouseX - cropStartPos.x; //
                        cropBox.height = mouseY - cropStartPos.y; //
                        break;
                    case 'move':
                        cropBox.x = cropStartBox.x + dx;
                        cropBox.y = cropStartBox.y + dy;
                        break;
                    case 'nw-resize':
                        cropBox.x = cropStartBox.x + dx;
                        cropBox.y = cropStartBox.y + dy;
                        cropBox.width = cropStartBox.width - dx;
                        cropBox.height = cropStartBox.height - dy;
                        break;
                    case 'ne-resize':
                        cropBox.y = cropStartBox.y + dy;
                        cropBox.width = cropStartBox.width + dx;
                        cropBox.height = cropStartBox.height - dy;
                        break;
                    case 'sw-resize':
                        cropBox.x = cropStartBox.x + dx;
                        cropBox.width = cropStartBox.width - dx;
                        cropBox.height = cropStartBox.height + dy;
                        break;
                    case 'se-resize':
                        cropBox.width = cropStartBox.width + dx;
                        cropBox.height = cropStartBox.height + dy;
                        break;
                }
            } else if (isDrawingAnnotation) {
                currentAnnotation.x2 = mouseX;
                currentAnnotation.y2 = mouseY;
            } else if (isDraggingAnnotation && selectedAnnotation !== null) {
                const dx = mouseX - annotationDragStart.x;
                const dy = mouseY - annotationDragStart.y;
                const annotation = currentlyEditingPanel.edits.annotations[selectedAnnotation];

                // Move the annotation
                switch (annotation.type) {
                    case 'text':
                        annotation.x += dx;
                        annotation.y += dy;
                        break;
                    case 'rect':
                    case 'arrow':
                        annotation.x1 += dx;
                        annotation.y1 += dy;
                        annotation.x2 += dx;
                        annotation.y2 += dy;
                        break;
                }

                annotationDragStart = { x: mouseX, y: mouseY }; // Update drag start for next move
            }
            redrawEditCanvas();
        });

        editCanvas.addEventListener('mouseup', () => {
            if (isCropping) {
                isCropping = false;

                // Robust normalization and validation for cropBox
                if (cropBox) {
                    const normalizedBox = {
                        x: Math.min(cropBox.x, cropBox.x + cropBox.width),
                        y: Math.min(cropBox.y, cropBox.y + cropBox.height),
                        width: Math.abs(cropBox.width),
                        height: Math.abs(cropBox.height)
                    };

                    // Clamp to canvas boundaries
                    normalizedBox.x = Math.max(0, Math.min(normalizedBox.x, editCanvas.width - 1));
                    normalizedBox.y = Math.max(0, Math.min(normalizedBox.y, editCanvas.height - 1));

                    // Ensure minimum dimensions and within canvas bounds
                    normalizedBox.width = Math.max(10, Math.min(normalizedBox.width, editCanvas.width - normalizedBox.x));
                    normalizedBox.height = Math.max(10, Math.min(normalizedBox.height, editCanvas.height - normalizedBox.y));

                    cropBox = normalizedBox;
                }

                cropInteractionMode = null;
                editCanvas.style.cursor = 'crosshair';
            }
            if (isDrawingAnnotation) {
                isDrawingAnnotation = false;
                if (currentlyEditingPanel && currentAnnotation) {
                    // FIX: Ensure new annotation is added only if it has meaningful dimensions (for rect/arrow)
                    if (currentAnnotation.type === 'text' || 
                        (currentAnnotation.type === 'rect' && Math.abs(currentAnnotation.x2 - currentAnnotation.x1) > 1 && Math.abs(currentAnnotation.y2 - currentAnnotation.y1) > 1) ||
                        (currentAnnotation.type === 'arrow' && (Math.abs(currentAnnotation.x2 - currentAnnotation.x1) > 1 || Math.abs(currentAnnotation.y2 - currentAnnotation.y1) > 1)) ) { //
                        currentlyEditingPanel.edits.annotations.push(currentAnnotation);
                        selectedAnnotation = currentlyEditingPanel.edits.annotations.length - 1; // Select the newly drawn one
                        showAnnotationStylingOptions(currentAnnotation.type); // Show options for newly drawn annotation
                        populateAnnotationControls(currentAnnotation); // Populate controls
                        saveAnnotationState(); // NEW: Save to annotation history
                    }
                }
                currentAnnotation = null;
                redrawEditCanvas();
            }
            if (isDraggingAnnotation) {
                isDraggingAnnotation = false;
            }
        });
    }

    // --- 11. AUXILIARY UI FUNCTION ---
    function updateAuxiliaryUI() {
        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) return;
        const activeFigure = project.figures[activeFigureIndex];

        customLabelsContainer.style.display = activeFigure.settings.labelStyle === 'custom' ? 'block' : 'none';
        customLabelsContainer.innerHTML = '';

        // Clear individual export container content
        const individualExportContent = individualExportContainer.querySelector('.card-content');
        if (individualExportContent) {
            individualExportContent.innerHTML = '';
        }

        const sortedPanels = [...activeFigure.panels].sort((a,b) => a.order - b.order);
        if (sortedPanels.length > 0) {
            individualExportContainer.classList.add('has-content');
            individualExportContainer.classList.remove('hidden');
        } else {
            individualExportContainer.classList.remove('has-content');
            individualExportContainer.classList.add('hidden');
        }

        // NEW: Update panel list
        updatePanelList();

        const panelColors = ['#007bff', '#28a745', '#17a2b8', '#fd7e14', '#6f42c1', '#dc3545'];
        sortedPanels.forEach((panel, index) => {
            const input = document.createElement('input');
            input.type = 'text';
            // FIX: If labelStyle is not custom, update the label when reordering
            if (activeFigure.settings.labelStyle !== 'custom') { //
                panel.label = String.fromCharCode(65 + index); // Re-label based on sorted order
            } //
            input.value = panel.label;
            input.title = `Custom label for panel in position ${panel.order + 1}`;
            input.addEventListener('change', () => saveState());
            input.addEventListener('input', (e) => {
                panel.label = e.target.value;
                renderFigure();
                const exportBtn = document.querySelector(`button[data-panel-id="${panel.id}"]`);
                if (exportBtn) { exportBtn.textContent = `Download Panel ${panel.label}`; }


            });
            customLabelsContainer.appendChild(input);

            const button = document.createElement('button');
            button.className = 'individual-export-btn';
            button.dataset.panelId = panel.id;
            button.textContent = `Download Panel ${panel.label}`;
            const color = panelColors[index % panelColors.length];
            button.style.backgroundColor = color;
            button.addEventListener('mouseover', () => button.style.backgroundColor = darkenColor(color, 20));
            button.addEventListener('mouseout', () => button.style.backgroundColor = color);
            button.addEventListener('click', () => {
                const link = document.createElement('a');
                link.href = panel.originalSrc;
                const extension = panel.originalFileType.split('/')[1];
                link.download = `Panel_${panel.label}.${extension}`;
                link.click();
            });
            const individualExportContent = individualExportContainer.querySelector('.card-content');
            if (individualExportContent) {
                individualExportContent.appendChild(button);
            }
        });
    }

    // --- 12. EXPORT FUNCTIONALITY ---
    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            if (!button.querySelector('.spinner')) { // Check if spinner already exists
                const spinnerSpan = document.createElement('span');
                spinnerSpan.className = 'spinner';
                button.appendChild(spinnerSpan);
            }
        } else {
            button.disabled = false;
            const spinner = button.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    async function generateHighResCanvas() {
        if (activeFigureIndex === -1) return null;
        const activeFigure = project.figures[activeFigureIndex];
        const settings = activeFigure.settings;
        const highResCanvas = document.createElement('canvas');
        const highResCtx = highResCanvas.getContext('2d');

        let targetDpi = parseInt(exportDpiSelect.value);
        if (exportDpiSelect.value === 'custom') {
            targetDpi = parseInt(exportDpiCustom.value) || 300;
        }
        const scaleFactor = targetDpi / 96;

        // FIX: Ensure exportPanels have full edits for high-res rendering
        // This is crucial for annotations and cropping to be included in final export.
        const exportPanels = activeFigure.panels.map(panel => ({
            ...panel,
            edits: { ...panel.edits }, // Deep copy edits
            image: panel.image // Keep reference to the currently loaded image object
        }));

        // Render each panel with its edits into a new image for the high-res canvas
        const editedPanelPromises = exportPanels.map(panel => {
            // generateEditedImage will apply crop, filters, and annotations
            return generateEditedImage(panel.pristineSrc, panel.edits, scaleFactor).then(src => {
                return new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => {
                        panel.image = img; // Update panel.image to the high-res edited version
                        panel.originalWidth = img.width; // Update dimensions to edited dimensions
                        panel.originalHeight = img.height; //
                        resolve(panel);
                    };
                    img.src = src;
                });
            });
        });

        const fullyPreparedPanels = await Promise.all(editedPanelPromises);


        const scaledSpacing = parseInt(settings.spacing) * scaleFactor;
        const scaledLabelSpacing = parseInt(settings.labelSpacing || 0) * scaleFactor;
        const scaledFontSize = parseInt(settings.labelFontSize) * PT_TO_PX * scaleFactor;
        const font = `${settings.labelFontWeight} ${scaledFontSize}px ${settings.labelFontFamily}`;
        highResCtx.font = font;
        const textMetrics = highResCtx.measureText('A');
        const scaledLabelHeight = (textMetrics.fontBoundingBoxAscent || scaledFontSize) * 1.2;
        const scaledLabelWidth = textMetrics.width * 2;
        const layoutOptions = { spacing: scaledSpacing, labelPosition: settings.labelPosition, labelWidth: scaledLabelWidth, labelHeight: scaledLabelHeight, maintainAspectRatio: settings.maintainAspectRatio };

        let effectiveLayout = settings.layout;
        let numCols = 1;

        // Preserve the smart layout selection made for the main canvas
        if (effectiveLayout === 'auto') {
            effectiveLayout = activeFigure.effectiveLayout || 'stack';
        }

        if (effectiveLayout === 'grid2x2') numCols = 2;
        if (effectiveLayout === 'grid3x3') numCols = 3;
        if (effectiveLayout === 'grid4xn') numCols = 4;

        const rules = allJournalRules[settings.journal] || allJournalRules['Default'];

        // Calculate canvas width with improved logic for visual consistency
        let baseCanvasWidthMM = settings.targetWidth !== null ? settings.targetWidth : rules.doubleColumnWidth_mm;

        // Apply minimum width constraint and scaling for narrow journals
        if (settings.targetWidth === null) { // Only apply to journal-preset widths, not custom widths
            if (baseCanvasWidthMM < MIN_CANVAS_WIDTH_MM) {
                // For very narrow journals like Science, scale up for better visual experience
                baseCanvasWidthMM = Math.max(MIN_CANVAS_WIDTH_MM, baseCanvasWidthMM * JOURNAL_SCALE_FACTOR);
            }
        }

        // Only recalculate panel dimensions for non-custom layouts
        if (effectiveLayout !== 'custom') {
            let canvasWidthForSizing = baseCanvasWidthMM * PIXELS_PER_MM * scaleFactor;

            // For spanning grids, handle width calculation properly
            let panelAreaWidth, colWidth;
            if (effectiveLayout.startsWith('grid')) {
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * scaledSpacing);
                colWidth = panelAreaWidth / numCols;
            } else {
                if (layoutOptions.labelPosition === 'left') {
                    canvasWidthForSizing -= (numCols * layoutOptions.labelWidth);
                }
                panelAreaWidth = canvasWidthForSizing - ((numCols + 1) * scaledSpacing);
                colWidth = panelAreaWidth / numCols;
            }

            fullyPreparedPanels.forEach(panel => {
                const scale = colWidth / panel.originalWidth;
                panel.displayWidth = colWidth;
                panel.displayHeight = panel.originalHeight * scale;
            });
        }

        let layoutDimensions;
        switch (effectiveLayout) {
            case 'stack': layoutDimensions = layoutVerticalStack(fullyPreparedPanels, layoutOptions); break;
            case 'grid2x2':
                layoutOptions.baseCanvasWidth = (baseCanvasWidthMM * PIXELS_PER_MM * scaleFactor);
                layoutDimensions = layoutSpanningGrid(fullyPreparedPanels, 2, layoutOptions);
                break;
            case 'grid3x3':
                layoutOptions.baseCanvasWidth = (baseCanvasWidthMM * PIXELS_PER_MM * scaleFactor);
                layoutDimensions = layoutSpanningGrid(fullyPreparedPanels, 3, layoutOptions);
                break;
            case 'grid4xn':
                layoutOptions.baseCanvasWidth = (baseCanvasWidthMM * PIXELS_PER_MM * scaleFactor);
                layoutDimensions = layoutSpanningGrid(fullyPreparedPanels, 4, layoutOptions);
                break;
            case 'custom':
                // Scale custom layout properties for high-res export
                fullyPreparedPanels.forEach(panel => {
                    panel.customX *= scaleFactor;
                    panel.customY *= scaleFactor;
                    panel.customWidth *= scaleFactor;
                    panel.customHeight *= scaleFactor;
                });
                layoutDimensions = layoutCustom(fullyPreparedPanels, layoutOptions);
                break;
            default: layoutDimensions = layoutVerticalStack(fullyPreparedPanels, layoutOptions); break;
        }

        highResCanvas.width = layoutDimensions.width;
        highResCanvas.height = layoutDimensions.height;

        const drawOptions = { 
            ...settings, 
            labelFontSize: parseInt(settings.labelFontSize) * scaleFactor, 
            labelSpacing: scaledLabelSpacing, 
            zoom: 1,
            isExport: true // Mark as export to prevent grid overlay
        };
        // FIX: drawFigureOnCanvas should now draw the `image` property of the prepared panels,
        // which already contain the baked-in edits including annotations.
        // So, no need to call drawPanelAnnotationsOnMainCanvas here.
        drawFigureOnCanvas(highResCtx, highResCanvas, layoutDimensions, fullyPreparedPanels, drawOptions); // Use fullyPreparedPanels
        return highResCanvas;
    }

    async function exportHighResClientSide(format, button) {
        if (activeFigureIndex === -1 || project.figures[activeFigureIndex].panels.length === 0) { alert("Please upload panels first."); return; }
        setLoadingState(button, true);
        try {
            const highResCanvas = await generateHighResCanvas();
            const dataUrl = highResCanvas.toDataURL(`image/${format}`, 0.9);
            const link = document.createElement('a');
            link.download = `figure.${format}`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error(`${format.toUpperCase()} Export Error:`, error);
            alert(`Failed to export high-resolution ${format.toUpperCase()}.`);
        } finally {
            setLoadingState(button, false);
        }
    }

    async function exportWithBackend(format, button) {
        if (activeFigureIndex === -1 || project.figures[activeFigureIndex].panels.length === 0) { alert("Please upload panels first."); return; }
        setLoadingState(button, true);
        try {
            const highResCanvas = await generateHighResCanvas();
            const canvasDataUrl = highResCanvas.toDataURL('image/png', 1.0);
            let targetDpi = parseInt(exportDpiSelect.value);
            if (exportDpiSelect.value === 'custom') {
                targetDpi = parseInt(exportDpiCustom.value) || 300;
            }
            const response = await fetch(`/api/export-${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ canvasDataUrl, journal: project.figures[activeFigureIndex].settings.journal, dpi: targetDpi })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error + (errorData.details ? `: ${errorData.details}` : ''));
            }
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `figure.${format}`;
            link.click();
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error(`Export Error (${format}):`, error);
            alert(`Failed to export ${format.toUpperCase()}: ${error.message}`);
        } finally {
            setLoadingState(button, false);
        }
    }


    // --- 13. SAVE/LOAD PROJECT LOGIC ---
    function loadProject(projectState) {
        if (!projectState || !projectState.figures) {
            alert("Invalid project file.");
            return;
        }
        project = { figures: [] };
        activeFigureIndex = projectState.activeFigureIndex;

        const figurePromises = projectState.figures.map(savedFigure => {
            return new Promise(resolveFigure => {
                const panelPromises = savedFigure.panels.map(savedPanel => {
                    return new Promise(async (resolvePanel) => {
                        // FIX: Ensure generateEditedImage correctly bakes annotations when loading
                        const editedSrc = await generateEditedImage(savedPanel.pristineSrc, savedPanel.edits); //
                        const img = new Image();
                        img.onload = () => resolvePanel({
                            ...savedPanel,
                            image: img,
                            originalWidth: img.width, // Set to edited image dimensions
                            originalHeight: img.height, //
                            originalSrc: editedSrc, // originalSrc now refers to the edited image data URL
                            id: 'panel_' + Date.now() + Math.random(), // Ensure unique ID on load
                        });
                        img.src = editedSrc;
                    });
                });
                Promise.all(panelPromises).then(rebuiltPanels => {
                    resolveFigure({ ...savedFigure, panels: rebuiltPanels });
                });
            });
        });

        Promise.all(figurePromises).then(rebuiltFigures => {
            project.figures = rebuiltFigures;
            initializeHistoryButtons();
            switchFigure(activeFigureIndex, false);
            // Only save state if we actually have panels loaded
            if (rebuiltFigures.some(fig => fig.panels && fig.panels.length > 0)) {
                saveState();
            }
        });
    }

    async function loadDemoPanels(demoNumber) {
        // Check if there's an active figure
        if (activeFigureIndex === -1 || !project.figures || !project.figures[activeFigureIndex]) {
            alert("Please add a figure first before loading demo panels.");
            throw new Error("No active figure available");
        }

        // Show loading dialog immediately
        showSmartLayoutLoadingDialog();

        // Initial delay for loading panels
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Define demo image mappings
        const demoMappings = {
            1: [
                'static/demo/Demo1_panel1.tiff',
                'static/demo/Demo1_panel2.tiff',
                'static/demo/Demo1_panel3.tiff',
                'static/demo/Demo1_panel4.tiff'
            ],
            2: [
                'static/demo/Demo2_panel1.svg',
                'static/demo/Demo2_panel2.svg',
                'static/demo/Demo2_panel3.svg',
                'static/demo/Demo2_panel4.svg'
            ],
            3: [
                'static/demo/Demo3_Panel1.png',
                'static/demo/Demo3_Panel2.png',
                'static/demo/Demo3_Panel3.png',
                'static/demo/Demo3_Panel4.png',
                'static/demo/Demo3_Panel5.png',
                'static/demo/Demo3_Panel6.png',
                'static/demo/Demo3_Panel7.png'
            ]
        };

        const imagePaths = demoMappings[demoNumber];
        if (!imagePaths) {
            alert("Invalid demo number.");
            hideSmartLayoutLoadingDialog();
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];

        // Clear existing panels
        activeFigure.panels = [];

        try {
            // Process each demo image
            const panelPromises = imagePaths.map((imagePath, index) => {
                return new Promise((resolve, reject) => {
                    // Check if it's a TIFF file
                    const isTiff = imagePath.toLowerCase().endsWith('.tiff') || imagePath.toLowerCase().endsWith('.tif');

                    if (isTiff) {
                        // Handle TIFF files using fetch and tiff.js
                        fetch(imagePath)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`Failed to fetch TIFF file: ${response.status}`);
                                }
                                return response.arrayBuffer();
                            })
                            .then(buffer => {
                                try {
                                    const tiff = new Tiff({ buffer: buffer });
                                    const canvas = tiff.toCanvas();
                                    const dataUrl = canvas.toDataURL('image/png');

                                    const img = new Image();
                                    img.onload = () => {
                                        const panel = {
                                            id: 'panel_' + Date.now() + "_" + index,
                                            image: img,
                                            originalWidth: img.width,
                                            originalHeight: img.height,
                                            x: 0,
                                            y: 0,
                                            displayWidth: 0,
                                            displayHeight: 0,
                                            order: index,
                                            label: String.fromCharCode(65 + index),
                                            originalSrc: dataUrl,
                                            pristineSrc: dataUrl,
                                            originalFileType: 'image/png',
                                            edits: {
                                                crop: null,
                                                brightness: 100,
                                                contrast: 100,
                                                greyscale: 0,
                                                rotation: 0,
                                                annotations: [],
                                                layoutSpan: { colspan: 1, rowspan: 1 }
                                            },
                                            customX: index * 220,
                                            customY: index * 220,
                                            customWidth: 200,
                                            customHeight: 200
                                        };
                                        resolve(panel);
                                    };
                                    img.onerror = () => reject(`Failed to load converted TIFF image: ${imagePath}`);
                                    img.src = dataUrl;
                                } catch (tiffError) {
                                    reject(`Failed to decode TIFF file ${imagePath}: ${tiffError.message}`);
                                }
                            })
                            .catch(fetchError => {
                                reject(`Failed to fetch TIFF file ${imagePath}: ${fetchError.message}`);
                            });
                    } else {
                        // Handle regular image files
                        const img = new Image();

                        img.onload = () => {
                            // Determine file type from extension
                            let fileType = 'image/png';
                            if (imagePath.toLowerCase().endsWith('.jpg') || imagePath.toLowerCase().endsWith('.jpeg')) {
                                fileType = 'image/jpeg';
                            } else if (imagePath.toLowerCase().endsWith('.png')) {
                                fileType = 'image/png';
                            } else if (imagePath.toLowerCase().endsWith('.svg')) {
                                fileType = 'image/svg+xml';
                            }

                            const panel = {
                                id: 'panel_' + Date.now() + "_" + index,
                                image: img,
                                originalWidth: img.width,
                                originalHeight: img.height,
                                x: 0,
                                y: 0,
                                displayWidth: 0,
                                displayHeight: 0,
                                order: index,
                                label: String.fromCharCode(65 + index),
                                originalSrc: imagePath,
                                pristineSrc: imagePath,
                                originalFileType: fileType,
                                edits: {
                                    crop: null,
                                    brightness: 100,
                                    contrast: 100,
                                    greyscale: 0,
                                    rotation: 0,
                                    annotations: [],
                                    layoutSpan: { colspan: 1, rowspan: 1 }
                                },
                                customX: index * 220,
                                customY: index * 220,
                                customWidth: 200,
                                customHeight: 200
                            };
                            resolve(panel);
                        };

                        img.onerror = () => {
                            reject(`Could not load demo image: ${imagePath}`);
                        };

                        img.src = imagePath;
                    }
                });
            });

            // Wait for all panels to load
            const loadedPanels = await Promise.all(panelPromises);

            // Add panels to active figure
            activeFigure.panels = loadedPanels;

            // Set layout to auto (Smart Layout)
            activeFigure.settings.layout = 'auto';
            updateLayoutButtonSelection('auto');

            // Initialize buttons as disabled before any changes
            initializeHistoryButtons();

            // Update auxiliary UI first
            updateAuxiliaryUI();

            // Additional delay before Smart Layout computation
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Render first
            renderFigure();

            // --- FIX: Ensure container is sized correctly after loading demo panels ---
            if (containerSizeMode === 'auto') {
                setContainerSize('auto');
            }

            // Hide loading dialog after everything is complete
            hideSmartLayoutLoadingDialog();

            // Initialize history with the first state (panels just loaded)
            historyStack = [getCurrentState()];
            redoStack = [];
            updateHistoryButtons();

            console.log(`Demo ${demoNumber} panels loaded successfully`);

        } catch (error) {
            console.error(`Error loading demo ${demoNumber} panels:`, error);
            hideSmartLayoutLoadingDialog(); // Ensure dialog is hidden on error
            alert(`Error loading demo ${demoNumber} panels. Some images may not be available.`);
            throw error; // Re-throw to trigger button error state
        }
    }

    // --- 14. UNDO/REDO FUNCTIONALITY ---
    function getCurrentState() {
        return JSON.parse(JSON.stringify({
            figures: project.figures.map(fig => ({
                ...fig,
                panels: fig.panels.map(panel => ({
                    id: panel.id,
                    label: panel.label,
                    order: panel.order,
                    pristineSrc: panel.pristineSrc,
                    edits: panel.edits,
                    originalFileType: panel.originalFileType
                }))
            })),
            activeFigureIndex: activeFigureIndex
        }));
    }

    async function restoreState(stateToRestore) {
        if (!stateToRestore || !stateToRestore.figures) {
            console.error("Attempted to restore invalid state.");
            return;
        }
        if (!project) project = {};

        const figurePromises = stateToRestore.figures.map(savedFigure => {
            return new Promise(resolveFigure => {
                if (!savedFigure.panels) {
                    resolveFigure({ ...savedFigure, panels: [] });
                    return;
                }
                const panelPromises = savedFigure.panels.map(savedPanel => {
                    return new Promise(async (resolvePanel) => {
                        // FIX: Ensure generateEditedImage correctly bakes annotations when restoring
                        const editedSrc = await generateEditedImage(savedPanel.pristineSrc, savedPanel.edits); //
                        const img = new Image();
                        img.onload = () => resolvePanel({
                            ...savedPanel,
                            image: img,
                            originalWidth: img.width, // Set to edited image dimensions
                            originalHeight: img.height, //
                            originalSrc: editedSrc, // originalSrc now refers to the edited image data URL
                        });
                        img.src = editedSrc;
                    });
                });
                Promise.all(panelPromises).then(rebuiltPanels => {
                    resolveFigure({ ...savedFigure, panels: rebuiltPanels });
                });
            });
        });

        project.figures = await Promise.all(figurePromises);
        activeFigureIndex = stateToRestore.activeFigureIndex;

        if (activeFigureIndex >= 0 && project.figures[activeFigureIndex]) {
            switchFigure(activeFigureIndex, false);
        } else if (project.figures.length > 0) {
            switchFigure(0, false);
        } else {
            renderTabs();
            renderFigure();
        }
    }

    function saveState() {
        redoStack = [];
        historyStack.push(getCurrentState());
        if (historyStack.length > 30) {
            historyStack.shift();
        }
        updateHistoryButtons();
    }

    async function undo() {
        if (historyStack.length < 2) return;

        isRestoringState = true;
        window.isRestoringState = true;

        // Move current state to redo stack
        redoStack.push(historyStack.pop());

        // Get the previous state (which should always exist due to the check above)
        const stateToRestore = historyStack[historyStack.length - 1];
        await restoreState(JSON.parse(JSON.stringify(stateToRestore)));

        isRestoringState = false;
        window.isRestoringState = false;

        // Update buttons after state restoration
        updateHistoryButtons();
    }

    async function redo() {
        if (redoStack.length === 0) return;

        isRestoringState = true;
        window.isRestoringState = true;

        const stateToRestore = redoStack.pop();
        historyStack.push(stateToRestore);
        await restoreState(JSON.parse(JSON.stringify(stateToRestore)));

        isRestoringState = false;
        window.isRestoringState = false;

        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        undoBtn.disabled = historyStack.length < 2;
        redoBtn.disabled = redoStack.length === 0;
    }

    function initializeHistoryButtons() {
        undoBtn.disabled = true;
        redoBtn.disabled = true;
    }

    async function resetAllChanges() {
        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex] || project.figures[activeFigureIndex].panels.length === 0) {
            alert("No panels to reset.");
            return;
        }

        if (!confirm("This will reset all panels to their original state. All edits (cropping, annotations, adjustments) and panel positions will be lost. Continue?")) {
            return;
        }

        // Check if we have a first state in history to reset to
        if (historyStack.length === 0) {
            alert("No initial state found to reset to.");
            return;
        }

        try {
            // Reset to the first state in history (when panels were just loaded)
            const firstState = historyStack[0];
            await restoreState(JSON.parse(JSON.stringify(firstState)));

            // Reset history to just the first state
            historyStack = [firstState];
            redoStack = [];
            updateHistoryButtons();

            // Reset custom layout state
            selectedPanelCustom = null;
            isPanelDraggingCustom = false;
            isPanelResizingCustom = false;
            activeResizeHandleType = null;

            console.log("All panels reset to original state");

        } catch (error) {
            console.error("Error resetting panels:", error);
            alert("Failed to reset panels. Please try again.");
        }
    }

    function updateLayoutButtonSelection(selectedLayoutType) {
        // Remove selected class from all layout buttons
        const allLayoutButtons = document.querySelectorAll('.layout-btn');
        allLayoutButtons.forEach(btn => {
            btn.classList.remove('selected');
        });

        // Find and select the appropriate button
        let targetButton = null;
        if (selectedLayoutType === 'auto') {
            // For auto layout, select the Smart Layout button
            targetButton = document.querySelector('.layout-btn[data-layout="auto"]');
        } else {
            // For other layouts, find the matching button
            targetButton = document.querySelector(`.layout-btn[data-layout="${selectedLayoutType}"]`);
        }

        if (targetButton) {
            targetButton.classList.add('selected');
        }
    }

    // Smart Layout Loading Dialog Control Functions
    function showSmartLayoutLoadingDialog() {
        if (smartLayoutLoadingModal) {
            smartLayoutLoadingModal.classList.remove('hidden');
        }
    }

    function hideSmartLayoutLoadingDialog() {
        if (smartLayoutLoadingModal) {
            smartLayoutLoadingModal.classList.add('hidden');
        }
    }


    // --- 15. HELPER FUNCTIONS ---
    function getMousePos(canvas, evt) {
        const rect   = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        // map clientX/Y into internal pixels, then undo pan only
        const x = (evt.clientX - rect.left) * scaleX - canvasPanX;
        const y = (evt.clientY - rect.top)  * scaleY - canvasPanY;
        return { x, y };
    }

    function isMouseOverPanel(mousePos, panel) {
        // Use customX/customY for custom layout, imageX/imageY for other layouts
        const activeFigure = project.figures[activeFigureIndex];
        if (activeFigure && activeFigure.settings.layout === 'custom') {
            return mousePos.x >= panel.customX && mousePos.x <= panel.customX + panel.customWidth &&
                   mousePos.y >= panel.customY && mousePos.y <= panel.customY + panel.customHeight;
        } else {
            return mousePos.x >= panel.imageX && mousePos.x <= panel.imageX + panel.displayWidth &&
                   mousePos.y >= panel.imageY && mousePos.y <= panel.imageY + panel.displayHeight;
        }
    }

    function getResizeHandle(mousePos, panel) {
        const handleSize = 8;
        const tolerance = handleSize / 2;

        // Use custom layout coordinates
        const handles = [
            { type: 'nw', x: panel.customX, y: panel.customY },
            { type: 'ne', x: panel.customX + panel.customWidth, y: panel.customY },
            { type: 'sw', x: panel.customX, y: panel.customY + panel.customHeight },
            { type: 'se', x: panel.customX + panel.customWidth, y: panel.customY + panel.customHeight }
        ];

        for (let handle of handles) {
            if (Math.abs(mousePos.x - handle.x) <= tolerance && Math.abs(mousePos.y - handle.y) <= tolerance) {
                return handle.type;
            }
        }
        return null;
    }

    function snapToGrid(value) {
        return Math.round(value / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
    }

    function getSnapPositions(panels, excludePanel) {
        const snapLines = [];
        panels.forEach(panel => {
            if (panel.id === excludePanel?.id) return;
            snapLines.push(panel.imageX); // left edge
            snapLines.push(panel.imageX + panel.displayWidth); // right edge
            snapLines.push(panel.imageY); // top edge
            snapLines.push(panel.imageY + panel.displayHeight); // bottom edge
        });
        return snapLines;
    }

    function findNearestSnap(value, snapLines, tolerance = SNAP_TOLERANCE) {
        for (let snapLine of snapLines) {
            if (Math.abs(value - snapLine) <= tolerance) {
                return snapLine;
            }
        }
        return value;
    }
    function darkenColor(hex, percent) {
        let r = parseInt(hex.substring(1, 3), 16);
        let g = parseInt(hex.substring(3, 5), 16);
        let b = parseInt(hex.substring(5, 7), 16);
        r = Math.floor(r * (100 - percent) / 100);
        g = Math.floor(g * (100 - percent) / 100);
        b = Math.floor(b * (100 - percent) / 100);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    // --- 16. MULTI-FIGURE FUNCTIONS ---
    function renderTabs() {
        figureTabsContainer.innerHTML = '';
        if (!project.figures) return;
        project.figures.forEach((fig, index) => {
            const tab = document.createElement('div');
            tab.className = 'figure-tab';
            tab.dataset.index = index;
            const tabLabel = document.createElement('span');
            tabLabel.textContent = `Figure ${index + 1}`;
            tab.appendChild(tabLabel);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-tab-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = `Delete Figure ${index + 1}`;
            deleteBtn.dataset.index = index;
            tab.appendChild(deleteBtn);
            if (index === activeFigureIndex) {
                tab.classList.add('active');
            }
            figureTabsContainer.appendChild(tab);
        });
    }

    function addFigure() {
        const newFigureNumber = project.figures.length + 1;
        project.figures.push({
            name: `Figure ${newFigureNumber}`,
            panels: [],
            caption: '', // NEW: Figure caption
            settings: {
                journal: 'Default', layout: 'auto', targetWidth: 180, spacing: '10',
                labelStyle: 'ABC', labelPosition: 'top', labelFontFamily: 'Arial',
                labelFontSize: '12', labelFontWeight: 'bold', exportDpi: '600', exportDpiCustom: '',
                maintainAspectRatio: true, labelSpacing: 0,
                // Grid control settings with proper defaults - uncheck label grid by default
                showGrid: false, 
                showPanelGrid: false,
                showLabelGrid: false,
                gridColor: '#000000', 
                gridType: 'dashed', 
                gridThickness: 1
            }
        });
        switchFigure(project.figures.length - 1, false); // Don't save history when switching to empty figure
        // Initialize buttons as disabled for new figures
        initializeHistoryButtons();
        // Fit to page by default for new figures
        setTimeout(() => {
            fitToPage();
        }, 100);
        // Don't save state for empty figure - wait until panels are loaded
    }

    function deleteFigure(indexToDelete) {
        if (project.figures.length <= 1) {
            // Show confirmation dialog for deleting the last figure
            showDeleteLastFigureDialog(indexToDelete);
            return;
        }
        project.figures.splice(indexToDelete, 1);
        if (activeFigureIndex >= indexToDelete) {
            activeFigureIndex = Math.max(0, activeFigureIndex - 1);
        }
        switchFigure(activeFigureIndex, false);
        saveState();
    }

    function showDeleteLastFigureDialog(indexToDelete) {
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'delete-last-figure-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>Delete Last Figure</h3>
                    <p>This will delete the last figure and reset the workspace. Do you want to save the project first?</p>
                    <div class="modal-buttons">
                        <button id="save-and-delete-btn" class="btn-primary">Yes, Save First</button>
                        <button id="delete-without-save-btn" class="btn-secondary">No, Don't Save</button>
                        <button id="cancel-delete-btn" class="btn-cancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        document.getElementById('save-and-delete-btn').addEventListener('click', () => {
            // Trigger save project
            const projectState = getCurrentState();
            const projectJson = JSON.stringify(projectState, null, 2);
            const blob = new Blob([projectJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'figure-assembler-project.json';
            link.click();
            URL.revokeObjectURL(url);

            // Then reset workspace
            resetWorkspace();
            document.body.removeChild(modal);
        });

        document.getElementById('delete-without-save-btn').addEventListener('click', () => {
            resetWorkspace();
            document.body.removeChild(modal);
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Close on overlay click
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target === modal.querySelector('.modal-overlay')) {
                document.body.removeChild(modal);
            }
        });
    }

    function resetWorkspace() {
        // Reset to a completely new project state
        project = { figures: [] };
        activeFigureIndex = -1;
        historyStack = [];
        redoStack = [];

        // Reset zoom and pan
        currentZoom = 1.0;
        canvasPanX = 0;
        canvasPanY = 0;

        // Reset canvas
        figureCanvas.width = 0;
        figureCanvas.height = 0;
        figureCanvas.style.transform = '';

        // Add new blank figure
        addFigure();

        // Update UI
        renderTabs();
        renderFigure();
        updateAuxiliaryUI();
        updateHistoryButtons();
    }

    function switchFigure(index, saveHistory = true) {
        if (saveHistory && activeFigureIndex !== -1 && activeFigureIndex < project.figures.length) {
            saveState();
        }

        // Reset custom layout state when switching figures
        selectedPanelCustom = null;
        isPanelDraggingCustom = false;
        isPanelResizingCustom = false;
        activeResizeHandleType = null;

        activeFigureIndex = index;
        const activeFigure = project.figures[activeFigureIndex];
        if (activeFigure) {
            journalSelect.value = activeFigure.settings.journal;
            labelStyleSelect.value = activeFigure.settings.labelStyle;
            labelPositionSelect.value = activeFigure.settings.labelPosition;
            labelFontFamilySelect.value = activeFigure.settings.labelFontFamily;
            labelFontSizeInput.value = activeFigure.settings.labelFontSize;
            labelFontWeightSelect.value = activeFigure.settings.labelFontWeight;
            targetWidthInput.value = activeFigure.settings.targetWidth || '';
            exportDpiSelect.value = activeFigure.settings.exportDpi;
            exportDpiCustom.value = activeFigure.settings.exportDpiCustom;
            exportDpiCustom.style.display = exportDpiSelect.value === 'custom' ? 'inline-block' : 'none';
            maintainAspectRatioCheckbox.checked = activeFigure.settings.maintainAspectRatio;
            figureCaptionEditor.value = activeFigure.caption || '';

            // Update spacing controls
            const currentSpacing = parseInt(activeFigure.settings.spacing) || 10;
            if (spacingSlider) {
                spacingSlider.value = currentSpacing;
                // Update slider progress for visual fill
                const progress = (currentSpacing / 50) * 100;
                spacingSlider.style.setProperty('--slider-progress', progress + '%');
            }
            if (spacingNumber) spacingNumber.value = currentSpacing;
            if (spacingDecrease) spacingDecrease.disabled = currentSpacing <= 0;
            if (spacingIncrease) spacingIncrease.disabled = currentSpacing >= 50;
            if (spacingPreview) spacingPreview.style.setProperty('--current-spacing', currentSpacing + 'px');
            if (spacingCurrentDisplay) spacingCurrentDisplay.textContent = currentSpacing + 'px';

            // Update label spacing controls
            const currentLabelSpacing = parseInt(activeFigure.settings.labelSpacing) || 0;
            if (labelSpacingNumber) labelSpacingNumber.value = currentLabelSpacing;
            if (labelSpacingValue) labelSpacingValue.textContent = currentLabelSpacing;
            if (labelSpacingDecrease) labelSpacingDecrease.disabled = currentLabelSpacing <= 0;
            if (labelSpacingIncrease) labelSpacingIncrease.disabled = currentLabelSpacing >= 30;

            // Update grid controls with proper error handling and hierarchical state management
            if (showGridCheckbox) {
                // Ensure grid settings exist with defaults
                if (!activeFigure.settings.hasOwnProperty('showGrid')) {
                    activeFigure.settings.showGrid = false;
                }
                const isGridEnabled = activeFigure.settings.showGrid === true;
                showGridCheckbox.checked = isGridEnabled;
                updateGridControlsState(isGridEnabled);
            }
            if (showPanelGridCheckbox) {
                // Set default if not present
                if (!activeFigure.settings.hasOwnProperty('showPanelGrid')) {
                    activeFigure.settings.showPanelGrid = false;
                }
                showPanelGridCheckbox.checked = activeFigure.settings.showPanelGrid === true;
            }
            if (showLabelGridCheckbox) {
                // Set default if not present
                if (!activeFigure.settings.hasOwnProperty('showLabelGrid')) {
                    activeFigure.settings.showLabelGrid = false;
                }
                showLabelGridCheckbox.checked = activeFigure.settings.showLabelGrid === true;
            }
            if (gridTypeSelect) {
                gridTypeSelect.value = activeFigure.settings.gridType || 'dashed';
            }
            if (gridThicknessInput) {
                gridThicknessInput.value = activeFigure.settings.gridThickness || 1;
            }
            if (gridColorInput) {
                gridColorInput.value = activeFigure.settings.gridColor || '#000000';
            }

            updateJournalInfoDisplay();
            updateAuxiliaryUI();
            updateLayoutButtonSelection(activeFigure.settings.layout);
            renderFigure();

            // Force grid redraw to ensure grid is visible if enabled
            setTimeout(() => {
                if (activeFigure.settings.showGrid) {
                    redrawCanvasOnly();
                }
            }, 100);
        }
        renderTabs();
    }

    function initializeNewProject() {
        project = { figures: [] };
        activeFigureIndex = -1;
        historyStack = [];
        redoStack = [];
        initializeHistoryButtons();
        addFigure();
    }

    // Zoom functions
    function zoomIn() {
        isZooming = true;
        currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
        window.currentZoom = currentZoom;
        restoreContainerOverflow();
        updateCanvasTransform();
        updateZoomDisplay();
        isZooming = false;
    }

    function zoomOut() {
        isZooming = true;
        currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
        window.currentZoom = currentZoom;
        restoreContainerOverflow();
        updateCanvasTransform();
        updateZoomDisplay();
        isZooming = false;
    }

    function resetZoom() {
        currentZoom = 1.0;
        window.currentZoom = currentZoom;
        // Use the unified centerCanvas function that works correctly
        centerCanvas();
        updateCanvasTransform();
        updateZoomDisplay();
    }

    // Helper function to restore container overflow when user interacts with canvas
    function restoreContainerOverflow() {
        const container = document.getElementById('figure-canvas-container');
        container.style.overflow = 'auto';
    }

    // Helper function to update canvas transform without centering
    function updateCanvasTransform() {
        if (!figureCanvas.width || !figureCanvas.height) return;

        // Update the canvas transform with current zoom and pan
        const wrapper = document.getElementById('canvas-wrapper');
        if (wrapper) {
            wrapper.style.transform = `scale(${currentZoom})`;
            wrapper.style.transformOrigin = '0 0';
        }
        const translatePart = (canvasPanX !== 0 || canvasPanY !== 0)
            ? `translate(${canvasPanX}px, ${canvasPanY}px)`
            : 'translate(0px, 0px)';
        figureCanvas.style.transform = translatePart;
        figureCanvas.style.transformOrigin = '0 0';
    }

    // NEW: Fit to page functionality - distinct from reset
    function fitToPage() {
        // Give the container a moment to settle after possible size change
        setTimeout(() => {
            fitToPageLogic(); // Use the dedicated fit-to-page logic
        }, 25);
    }

    // Dedicated fit-to-page logic with its own calculation
    function fitToPageLogic() {
        if (!figureCanvas || !figureCanvas.width || !figureCanvas.height) return;

        const container = document.getElementById('figure-canvas-container');
        if (!container) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasWidthCSS = figureCanvas.width;
        const canvasHeightCSS = figureCanvas.height;

        // Force reflow to ensure styles are applied
        container.offsetHeight;
        // Use clientWidth and clientHeight for more accurate size, excluding scrollbars
        const availableWidth = container.clientWidth;
        const availableHeight = container.clientHeight;

        // Ensure we have valid dimensions
        if (availableWidth <= 0 || availableHeight <= 0) {
            console.warn('Container dimensions not ready for fit to page');
            return;
        }

        const tolerance = 2; // px, to account for rounding errors

        // Helper to check if a given zoom fits
        function fits(zoom) {
            return (
                canvasWidthCSS * zoom <= availableWidth + tolerance &&
                canvasHeightCSS * zoom <= availableHeight + tolerance
            );
        }

        let newZoom = 1.0;
        if (fits(1.0)) {
            newZoom = 1.0;
        } else {
            // Find the minimum scale needed to fit
            const minScale = Math.min(availableWidth / canvasWidthCSS, availableHeight / canvasHeightCSS);
            // Smart binary search for the largest zoom that fits (between minScale and 1.0)
            let low = minScale;
            let high = 1.0;
            let best = minScale;
            for (let i = 0; i < 10; i++) { // 10 iterations is enough for pixel precision
                let mid = (low + high) / 2;
                if (fits(mid)) {
                    best = mid;
                    low = mid;
                } else {
                    high = mid;
                }
            }
            newZoom = Math.min(best, 1.0); // Ensure zoom never exceeds 1
        }

        // Force update the zoom level (ignore current zoom comparison)
        currentZoom = newZoom;
        window.currentZoom = currentZoom;

        // Explicitly center the canvas
        centerCanvas();

        // Update the canvas transform
        updateCanvasTransform();
        updateZoomDisplay();

        // Ensure the wrapper is sized to the canvas (prevents overflow)
        const wrapper = document.getElementById('canvas-wrapper');
        if (wrapper) {
            wrapper.style.width = figureCanvas.width + 'px';
            wrapper.style.height = figureCanvas.height + 'px';
        }

        // Debugging: Log bounding rects of container, wrapper, and canvas
        const containerRect = container.getBoundingClientRect();
        const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : null;
        const canvasRect = figureCanvas.getBoundingClientRect();
        console.log('DEBUG: Bounding rects after fitToPageLogic:', {
            container: {
                top: containerRect.top,
                bottom: containerRect.bottom,
                left: containerRect.left,
                right: containerRect.right,
                width: containerRect.width,
                height: containerRect.height
            },
            wrapper: wrapperRect ? {
                top: wrapperRect.top,
                bottom: wrapperRect.bottom,
                left: wrapperRect.left,
                right: wrapperRect.right,
                width: wrapperRect.width,
                height: wrapperRect.height
            } : null,
            canvas: {
                top: canvasRect.top,
                bottom: canvasRect.bottom,
                left: canvasRect.left,
                right: canvasRect.right,
                width: canvasRect.width,
                height: canvasRect.height
            }
        });

        console.log(`Fit to page: CanvasCSS ${canvasWidthCSS}x${canvasHeightCSS}, Container ${availableWidth}x${availableHeight}, Zoom: ${newZoom}`);
    }

    function centerCanvas() {
        canvasPanX = 0;
        window.canvasPanX = canvasPanX;
        canvasPanY = 0;
        window.canvasPanY = canvasPanY;
    }

    function calculateAutoContainerSize() {
        if (!figureCanvas.width || !figureCanvas.height) return;

        const container = document.getElementById('figure-canvas-container');
        const sidebar = document.getElementById('sticky-sidebar-wrapper');
        const sidebarWidth = sidebar ? sidebar.offsetWidth : 380; // Default sidebar width

        // Account for sidebar and other UI elements
        const availableWidth = window.innerWidth - sidebarWidth - 100; // 100px for margins/padding
        const maxWidth = Math.min(availableWidth * 0.9, window.innerWidth * 0.7); // 90% of available width or 70% of viewport
        const maxHeight = window.innerHeight * 0.6; // 60% of viewport height (more conservative)

        const aspectRatio = figureCanvas.width / figureCanvas.height;

        let containerWidth, containerHeight;

        if (aspectRatio > 1) {
            // Landscape figure
            containerWidth = Math.min(figureCanvas.width, maxWidth);
            containerHeight = containerWidth / aspectRatio;

            if (containerHeight > maxHeight) {
                containerHeight = maxHeight;
                containerWidth = containerHeight * aspectRatio;
            }
        } else {
            // Portrait figure
            containerHeight = Math.min(figureCanvas.height, maxHeight);
            containerWidth = containerHeight * aspectRatio;

            if (containerWidth > maxWidth) {
                containerWidth = maxWidth;
                containerHeight = containerWidth / aspectRatio;
            }
        }

        // Add minimal padding in auto mode and ensure minimum size
        containerWidth = Math.max(400, Math.min(containerWidth + 0, maxWidth)); // Reduced from 80 to 20 for auto mode
        containerHeight = Math.max(300, Math.min(containerHeight + 0, maxHeight)); // Reduced from 80 to 20 for auto mode

        return { width: containerWidth, height: containerHeight };
    }

    function updateContainerForAutoSize() {
        if (containerSizeMode !== 'auto') return;

        const dimensions = calculateAutoContainerSize();
        if (dimensions) {
            const container = document.getElementById('figure-canvas-container');

            // Clear any existing inline styles first
            container.style.width = '';
            container.style.height = '';

            // Force a reflow to ensure CSS classes are applied
            container.offsetHeight;

            // Set the new calculated dimensions
            container.style.width = `${dimensions.width}px`;
            container.style.height = `${dimensions.height}px`;

            // Force another reflow to ensure the new dimensions are applied
            container.offsetHeight;

            // For auto mode, we still need to recalculate zoom and fitting when container size changes
            // This preserves the user's zoom level for other changes but recalculates when container size changes
            setTimeout(() => {
                fitToPageLogic();
            }, 25);
        }
    }

    // New function to update container size without affecting zoom (for figure edits)
    function updateContainerSizeOnly() {
        if (containerSizeMode !== 'auto') return;

        const dimensions = calculateAutoContainerSize();
        if (dimensions) {
            const container = document.getElementById('figure-canvas-container');

            // Clear any existing inline styles first
            container.style.width = '';
            container.style.height = '';

            // Force a reflow to ensure CSS classes are applied
            container.offsetHeight;

            // Set the new calculated dimensions
            container.style.width = `${dimensions.width}px`;
            container.style.height = `${dimensions.height}px`;

            // Force another reflow to ensure the new dimensions are applied
            container.offsetHeight;

            // Don't call centerAndFitCanvas() - preserve current zoom and pan
            // Just update the canvas transform to maintain current zoom level
            updateCanvasTransform();
        }
    }

    // --- 18. NEW PANEL MANAGEMENT FUNCTIONS ---

    // Update panel list display
    function updatePanelList() {
        if (!panelListContainer || activeFigureIndex === -1 || !project.figures[activeFigureIndex]) {
            if (panelListContainer) panelListContainer.innerHTML = '';
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        const sortedPanels = [...activeFigure.panels].sort((a,b) => a.order - b.order);

        panelListContainer.innerHTML = '';

        sortedPanels.forEach((panel, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'panel-list-item';
            listItem.draggable = true;
            listItem.dataset.panelId = panel.id;
            listItem.dataset.panelIndex = index;

            listItem.innerHTML = `
                <div class="panel-info">
                    <canvas class="panel-thumbnail" width="24" height="24"></canvas>
                    <span class="panel-label">${panel.label}</span>
                </div>
                <div class="panel-actions">
                    <button class="panel-edit-btn btn-3d-edit" data-panel-id="${panel.id}" title="Edit panel">
                        <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="panel-delete-btn" data-panel-id="${panel.id}" title="Delete panel">×</button>
                    <span class="panel-drag-handle material-symbols-outlined">drag_indicator</span>
                </div>
            `;

            // Draw thumbnail
            const thumbnail = listItem.querySelector('.panel-thumbnail');
            const thumbCtx = thumbnail.getContext('2d');
            const scale = Math.min(24 / panel.originalWidth, 24 / panel.originalHeight);
            const w = panel.originalWidth * scale;
            const h = panel.originalHeight * scale;
            thumbCtx.drawImage(panel.image, (24-w)/2, (24-h)/2, w, h);

            // Add edit button listener
            const editBtn = listItem.querySelector('.panel-edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(panel);
            });

            // Add delete button listener
            const deleteBtn = listItem.querySelector('.panel-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete panel ${panel.label}?`)) {
                    deletePanelById(panel.id);
                }
            });

            panelListContainer.appendChild(listItem);
        });

        attachPanelListListeners();
    }

    // Function to delete panel by ID
    function deletePanelById(panelId) {
        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) return;

        const activeFigure = project.figures[activeFigureIndex];
        const panelIndex = activeFigure.panels.findIndex(p => p.id === panelId);

        if (panelIndex !== -1) {
            activeFigure.panels.splice(panelIndex, 1);
            // Re-label remaining panels
            activeFigure.panels.forEach((panel, index) => {
                panel.order = index;
                if (activeFigure.settings.labelStyle !== 'custom') {
                    panel.label = String.fromCharCode(65 + index);
                }
            });
            saveState();
            updateAuxiliaryUI();
            renderFigure();
        }
    }

    // Attach drag and drop listeners to panel list items
    function attachPanelListListeners() {
        const listItems = panelListContainer.querySelectorAll('.panel-list-item');

        listItems.forEach(item => {
            item.addEventListener('dragstart', handlePanelDragStart);
            item.addEventListener('dragover', handlePanelDragOver);
            item.addEventListener('dragleave', handlePanelDragLeave);
            item.addEventListener('drop', handlePanelDrop);
            item.addEventListener('dragend', handlePanelDragEnd);
        });
    }

    function handlePanelDragStart(e) {
        draggedPanelIndex = parseInt(e.target.dataset.panelIndex);
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handlePanelDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.target.classList.add('drag-over');
    }

    function handlePanelDragLeave(e) {
        e.target.classList.remove('drag-over');
    }

    function handlePanelDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');

        const targetIndex = parseInt(e.target.dataset.panelIndex);

        if (draggedPanelIndex !== null && targetIndex !== draggedPanelIndex) {
            reorderPanels(draggedPanelIndex, targetIndex);
        }
    }

    function handlePanelDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.panel-list-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        draggedPanelIndex = null;
    }

    // Reorder panels and update labels
    function reorderPanels(fromIndex, toIndex) {
        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) return;

        const activeFigure = project.figures[activeFigureIndex];
        const sortedPanels = [...activeFigure.panels].sort((a,b) => a.order - b.order);

        // Move panel
        const movedPanel = sortedPanels.splice(fromIndex, 1)[0];
        sortedPanels.splice(toIndex, 0, movedPanel);

        // Update order and labels
        sortedPanels.forEach((panel, index) => {
            panel.order = index;
            // Only update labels if not using custom labels or if panel doesn't have custom text
            if (activeFigure.settings.labelStyle !== 'custom') {
                panel.label = String.fromCharCode(65 + index); // A, B, C...
            }
        });

        saveState();
        updateAuxiliaryUI();
        renderFigure();
    }

    // Context menu functions
    function showContextMenu(x, y, panel) {
        contextMenuTargetPanel = panel;
        panelContextMenu.style.left = x + 'px';
        panelContextMenu.style.top = y + 'px';
        panelContextMenu.style.display = 'block';
    }

    function hideContextMenu() {
        panelContextMenu.style.display = 'none';
        contextMenuTargetPanel = null;
    }

    function handleContextMenuAction(action) {
        if (!contextMenuTargetPanel || activeFigureIndex === -1) return;

        const activeFigure = project.figures[activeFigureIndex];
        const panelIndex = activeFigure.panels.findIndex(p => p.id === contextMenuTargetPanel.id);

        switch (action) {
            case 'edit':
                openEditModal(contextMenuTargetPanel);
                break;
            case 'delete':
                if (confirm(`Delete panel ${contextMenuTargetPanel.label}?`)) {
                    activeFigure.panels.splice(panelIndex, 1);
                    // Re-label remaining panels
                    activeFigure.panels.forEach((panel, index) => {
                        panel.order = index;
                        if (activeFigure.settings.labelStyle !== 'custom') {
                            panel.label = String.fromCharCode(65 + index);
                        }
                    });
                    saveState();
                    updateAuxiliaryUI();
                    renderFigure();
                }
                break;
            case 'bring-front':
                contextMenuTargetPanel.order = activeFigure.panels.length - 1;
                reorderPanelsByOrder();
                break;
            case 'send-back':
                contextMenuTargetPanel.order = 0;
                reorderPanelsByOrder();
                break;
        }
        hideContextMenu();
    }

    function reorderPanelsByOrder() {
        if (activeFigureIndex === -1) return;
        const activeFigure = project.figures[activeFigureIndex];

        // Sort by order and reassign sequential orders
        activeFigure.panels.sort((a, b) => a.order - b.order);
        activeFigure.panels.forEach((panel, index) => {
            panel.order = index;
            if (activeFigure.settings.labelStyle !== 'custom') {
                panel.label = String.fromCharCode(65 + index);
            }
        });

        saveState();
        updateAuxiliaryUI();
        renderFigure();
    }



    // --- 18. GRID CONTROLS STATE MANAGEMENT ---

    function updateGridControlsState(isGridEnabled) {
        const gridSubControls = document.getElementById('grid-sub-controls');
        if (gridSubControls) {
            if (isGridEnabled) {
                gridSubControls.classList.remove('disabled');
            } else {
                gridSubControls.classList.add('disabled');
                // When main grid is disabled, also uncheck sub-options
                if (showPanelGridCheckbox) {
                    showPanelGridCheckbox.checked = false;
                    if (activeFigureIndex !== -1 && project.figures[activeFigureIndex]) {
                        handleSettingChange('showPanelGrid', false);
                    }
                }
                if (showLabelGridCheckbox) {
                    showLabelGridCheckbox.checked = false;
                    if (activeFigureIndex !== -1 && project.figures[activeFigureIndex]) {
                        handleSettingChange('showLabelGrid', false);
                    }
                }
            }
        }
    }

    // --- 19. JOURNAL INFO DISPLAY ---

    function updateJournalInfoDisplay() {
        const journalInfoDisplay = document.getElementById('journal-info-display');
        if (!journalInfoDisplay) return;

        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) {
            journalInfoDisplay.innerHTML = '';
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        const selectedJournal = activeFigure.settings.journal;
        const rules = allJournalRules[selectedJournal];

        // Clear display if no specific journal is selected or if using custom width
        if (!rules || selectedJournal === 'Default' || activeFigure.settings.targetWidth !== null) {
            journalInfoDisplay.innerHTML = '';
            return;
        }

        // Display journal-specific information
        const journalName = selectedJournal;
        let infoHTML = `<h5>${journalName} Specifications</h5><ul>`;

        if (rules.doubleColumnWidth_mm) {
            // Calculate the actual canvas width being used
            let actualCanvasWidthMM = rules.doubleColumnWidth_mm;
            if (actualCanvasWidthMM < MIN_CANVAS_WIDTH_MM) {
                actualCanvasWidthMM = Math.max(MIN_CANVAS_WIDTH_MM, actualCanvasWidthMM * JOURNAL_SCALE_FACTOR);
            }
            infoHTML += `<li><span class="journal-spec">Double Column (default):</span> ${rules.doubleColumnWidth_mm}mm`;
            if (actualCanvasWidthMM !== rules.doubleColumnWidth_mm) {
                infoHTML += ` <span class=\"journal-note\">(displayed at ${Math.round(actualCanvasWidthMM)}mm for better visibility)</span>`;
            }
            infoHTML += `</li>`;
        }

        if (rules.maxHeight_mm) {
            infoHTML += `<li><span class="journal-spec">Max Height:</span> ${rules.maxHeight_mm}mm</li>`;
        }

        if (rules.dpi_halftone) {
            infoHTML += `<li><span class="journal-spec">Required DPI:</span> ${rules.dpi_halftone}</li>`;
        }

        if (rules.font_min_pt) {
            infoHTML += `<li><span class="journal-spec">Min Font Size:</span> ${rules.font_min_pt}pt</li>`;
        }

        infoHTML += '</ul>';
        journalInfoDisplay.innerHTML = infoHTML;
    }

    // --- 20. LAYOUT SPAN CONTROLS UPDATE ---

    function updateLayoutSpanControls() {
        const layoutSpanControls = document.getElementById('layout-span-controls');
        const currentLayoutIndicator = document.getElementById('current-layout-indicator');

        if (!layoutSpanControls || !currentLayoutIndicator) {
            console.warn('Layout span controls elements not found');
            return;
        }

        if (activeFigureIndex === -1 || !project.figures[activeFigureIndex]) {
            layoutSpanControls.style.display = 'none';
            currentLayoutIndicator.textContent = 'N/A';
            return;
        }

        const activeFigure = project.figures[activeFigureIndex];
        let effectiveLayout = activeFigure.settings.layout;

        if (effectiveLayout === 'auto') {
            // Use the stored effective layout from Smart Layout selection, or default to 'stack'
            effectiveLayout = activeFigure.effectiveLayout || 'stack';
        }

        currentLayoutIndicator.textContent = effectiveLayout;

        // Show/hide controls based on layout
        console.log('updateLayoutSpanControls: effectiveLayout =', effectiveLayout);
        if (effectiveLayout.startsWith('grid') && (effectiveLayout === 'grid2x2' || effectiveLayout === 'grid3x3' || effectiveLayout === 'grid4xn')) {
            layoutSpanControls.style.display = 'block';
            let maxCols = 1;
            if (effectiveLayout === 'grid2x2') maxCols = 2;
            else if (effectiveLayout === 'grid3x3') maxCols = 3;
            else if (effectiveLayout === 'grid4xn') maxCols = 4;

            panelColspanInput.max = maxCols;
            panelRowspanInput.max = 10; // Allow reasonable row spanning
            console.log('Layout span controls are visible for grid layout:', effectiveLayout, 'maxCols:', maxCols);
        } else {
            layoutSpanControls.style.display = 'none';
            console.log('Layout span controls are hidden for layout:', effectiveLayout);
        }
    }

    // --- 21. ANNOTATION HISTORY FUNCTIONS ---

    function saveAnnotationState() {
        if (!currentlyEditingPanel) return;

        annotationRedoStack = []; // Clear redo stack on new action
        annotationHistoryStack.push(JSON.parse(JSON.stringify(currentlyEditingPanel.edits.annotations)));

        // Limit history stack size
        if (annotationHistoryStack.length > 20) {
            annotationHistoryStack.shift();
        }

        updateAnnotationHistoryButtons();
    }

    function undoAnnotation() {
        if (annotationHistoryStack.length < 2 || !currentlyEditingPanel) return;

        annotationRedoStack.push(annotationHistoryStack.pop());
        const previousState = annotationHistoryStack[annotationHistoryStack.length - 1];
        currentlyEditingPanel.edits.annotations = JSON.parse(JSON.stringify(previousState));

        selectedAnnotation = null;
        hideAnnotationStylingOptions();
        redrawEditCanvas();
        updateAnnotationHistoryButtons();
    }

    function redoAnnotation() {
        if (annotationRedoStack.length === 0 || !currentlyEditingPanel) return;

        const nextState = annotationRedoStack.pop();
        annotationHistoryStack.push(nextState);
        currentlyEditingPanel.edits.annotations = JSON.parse(JSON.stringify(nextState));

        selectedAnnotation = null;
        hideAnnotationStylingOptions();
        redrawEditCanvas();
        updateAnnotationHistoryButtons();
    }

    function updateAnnotationHistoryButtons() {
        if (undoAnnotationBtn) undoAnnotationBtn.disabled = annotationHistoryStack.length < 2;
        if (redoAnnotationBtn) redoAnnotationBtn.disabled = annotationRedoStack.length === 0;
    }

    function resetAnnotationHistory() {
        annotationHistoryStack = [];
        annotationRedoStack = [];
        if (currentlyEditingPanel) {
            annotationHistoryStack.push(JSON.parse(JSON.stringify(currentlyEditingPanel.edits.annotations || [])));
        }
        updateAnnotationHistoryButtons();
    }

    // --- 22. FEEDBACK MODAL FUNCTIONS ---
    function showFeedbackModal() {
        // Reset form
        selectedRating = null;
        emojiButtons.forEach(btn => btn.classList.remove('selected'));
        if (feedbackText) feedbackText.value = '';
        if (feedbackSubmitBtn) {
            feedbackSubmitBtn.disabled = false;
            feedbackSubmitBtn.textContent = 'Submit';
        }

        if (feedbackModal) {
            feedbackModal.classList.remove('hidden');
        }
    }

    function closeFeedbackModal() {
        if (feedbackModal) {
            feedbackModal.classList.add('hidden');
        }
    }

    async function submitFeedback() {
        const feedbackContent = feedbackText ? feedbackText.value.trim() : '';

        // At least rating or feedback text is required
        if (!selectedRating && !feedbackContent) {
            alert('Please provide a rating or feedback text.');
            return;
        }

        setLoadingState(feedbackSubmitBtn, true);
        feedbackSubmitBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/submit-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: selectedRating,
                    feedback: feedbackContent,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                })
            });

            if (response.ok) {
                feedbackSubmitBtn.textContent = 'Thank you!';
                feedbackSubmitBtn.style.background = 'linear-gradient(145deg, #20c997, #17a2b8)';
                setTimeout(() => {
                    closeFeedbackModal();
                }, 1500);
            } else {
                throw new Error('Failed to submit feedback');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            alert('Failed to submit feedback. Please try again.');
            feedbackSubmitBtn.textContent = 'Submit';
        } finally {
            setLoadingState(feedbackSubmitBtn, false);
        }
    }

    // --- 23. INITIALIZE THE APP ---
    attachEventListeners();
    attachEditModalListeners();
    loadJournalRules().then(() => {
        initializeNewProject();

        // Initialize container with auto-size class
        const container = document.getElementById('figure-canvas-container');
        if (container) {
            container.classList.add('auto-size');
        }

        // Ensure canvas is fitted after initialization
        setTimeout(() => {
            if (figureCanvas.width && figureCanvas.height) {
                fitToPage();
            }
        }, 200);

        // Initialize spacing slider progress
        if (spacingSlider) {
            const initialVal = parseInt(spacingSlider.value) || 10;
            const progress = (initialVal / 50) * 100;
            spacingSlider.style.setProperty('--slider-progress', progress + '%');
        }
        // Initialize layout button selection
        setTimeout(() => {
            if (activeFigureIndex >= 0 && project.figures[activeFigureIndex]) {
                updateLayoutButtonSelection(project.figures[activeFigureIndex].settings.layout);
            }
        }, 100);

        // --- Edit Modal Side Panel: Collapsible, Resizable, Accordion, Accessibility ---
        const editControlsPanel = document.getElementById('edit-controls-panel');
        const collapseBtn = document.getElementById('collapse-edit-controls');
        const modalContent = document.querySelector('#edit-modal .modal-content');
        let lastPanelWidth = 350; // Default "open" width

        if (collapseBtn && editControlsPanel && modalContent) {
            collapseBtn.addEventListener('click', () => {
                const isCollapsed = editControlsPanel.classList.toggle('collapsed');
                if (isCollapsed) {
                    const currentGridCols = window.getComputedStyle(modalContent).gridTemplateColumns.split(' ');
                    if (currentGridCols.length > 1) {
                        const colWidthPx = parseInt(currentGridCols[1]);
                        if (!isNaN(colWidthPx) && colWidthPx >= 220) lastPanelWidth = colWidthPx;
                    }
                    modalContent.style.gridTemplateColumns = '1fr 36px';
                } else {
                    modalContent.style.gridTemplateColumns = `1fr ${lastPanelWidth}px`;
                }
            });
        }

        const resizeHandle = document.getElementById('edit-controls-resize-handle');
        let isResizing = false;

        if (resizeHandle && editControlsPanel && modalContent) {
            resizeHandle.addEventListener('mousedown', (e) => {
                if (editControlsPanel.classList.contains('collapsed')) {
                    // Do nothing if collapsed
                    return;
                }
                isResizing = true;
                const startX = e.clientX;
                editControlsPanel.classList.remove('collapsed');
                const currentGridCols = window.getComputedStyle(modalContent).gridTemplateColumns.split(' ');
                const startWidth = parseInt(currentGridCols[1]) || 350;
                document.body.style.cursor = 'ew-resize';
                document.body.style.userSelect = 'none';

                function onMouseMove(e) {
                    if (!isResizing) return;
                    let newWidth = startWidth - (e.clientX - startX);
                    newWidth = Math.max(260, Math.min(600, newWidth));
                    lastPanelWidth = newWidth;
                    modalContent.style.gridTemplateColumns = `1fr ${newWidth}px`;
                }

                function onMouseUp() {
                    if (isResizing) {
                        isResizing = false;
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    }
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }

        const accordionHeaders = document.querySelectorAll('.accordion-header');
        accordionHeaders.forEach((header, idx) => {
            header.addEventListener('click', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                header.setAttribute('aria-expanded', String(!isExpanded));
                const panel = header.nextElementSibling;
                panel.hidden = isExpanded;
            });
            if (idx === 0) {
                header.click(); // Open the first one by default
            }
        });
    });

    function setContainerSize(mode, customWidth = null, customHeight = null) {
        const container = document.getElementById('figure-canvas-container');

        console.log(`Setting container size to: ${mode}`, { customWidth, customHeight });

        // Remove all size classes
        container.classList.remove('auto-size', 'small-size', 'medium-size', 'large-size', 'custom-size');

        // Clear any existing inline styles first
        container.style.width = '';
        container.style.height = '';

        // Responsive sizing logic
        if (mode === 'auto') {
            // Use a percentage of the viewport, with min/max
            let width = Math.min(window.innerWidth * 0.8, 1200);
            let height = Math.min(window.innerHeight * 0.7, 900);
            width = Math.max(width, 300);
            height = Math.max(height, 200);
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        } else if (mode === 'small') {
            let width = Math.max(window.innerWidth * 0.4, 300);
            let height = Math.max(window.innerHeight * 0.3, 200);
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        } else if (mode === 'medium') {
            let width = Math.max(window.innerWidth * 0.6, 400);
            let height = Math.max(window.innerHeight * 0.45, 300);
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        } else if (mode === 'large') {
            let width = Math.min(window.innerWidth * 0.8, 1600);
            let height = Math.min(window.innerHeight * 0.6, 1200);
            container.style.width = width + 'px';
            container.style.height = height + 'px';
        } else if (mode === 'custom' && customWidth && customHeight) {
            container.style.width = customWidth + 'px';
            container.style.height = customHeight + 'px';
            customContainerWidth = customWidth;
            customContainerHeight = customHeight;
        }
        container.style.overflow = 'auto';

        // For auto mode, we'll calculate dimensions later
        containerSizeMode = mode;

        // Force another reflow to ensure the new dimensions are applied
        container.offsetHeight;

        // Debug: Check what the actual computed styles are
        const computedStyle = getComputedStyle(container);
        console.log(`Container size set to: ${mode}`, { 
            customWidth, 
            customHeight,
            inlineWidth: container.style.width,
            inlineHeight: container.style.height,
            computedWidth: computedStyle.width,
            computedHeight: computedStyle.height
        });

        // Reset canvas transform but preserve zoom and pan state
        if (figureCanvas) {
            figureCanvas.style.transform = 'scale(1)';
        }

        // Handle auto mode specially to recalculate size
        if (mode === 'auto') {
            setTimeout(() => {
                updateContainerForAutoSize();
            }, 25);
        } else {
            // For non-auto modes, re-render to update the canvas's intrinsic size,
            // then wait for the container's CSS transition to finish before fitting.
            console.log('Triggering re-render for container size change');
            if (activeFigureIndex >= 0 && project.figures && project.figures[activeFigureIndex]) {
                renderFigure(true); // Re-render synchronously.
            }

            // The container has a 150ms CSS transition. We wait slightly longer to be safe.
            setTimeout(() => {
                console.log('Fitting canvas after re-render and transition');
                fitToPageLogic();
            }, 160);
        }
    }

    function handleContainerSizeChange() {
        const mode = containerSizeSelect.value;

        if (mode === 'custom') {
            customSizeControls.classList.remove('hidden');
        } else {
            customSizeControls.classList.add('hidden');
            setContainerSize(mode);
        }
    }

    function applyCustomSize() {
        const width = parseInt(customWidthInput.value);
        const height = parseInt(customHeightInput.value);

        if (width >= 200 && width <= 2000 && height >= 200 && height <= 2000) {
            setContainerSize('custom', width, height);
        } else {
            alert('Please enter valid dimensions between 200px and 2000px.');
        }
    }