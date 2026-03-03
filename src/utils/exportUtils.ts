/**
 * @file exportUtils.ts
 * @description Utilidades para exportación de datos (PNG, PDF)
 * 
 * MANTENIMIENTO:
 * - Maneja compatibilidad con CSS variables para html2canvas
 * - Si html2canvas falla, revisar si hay funciones de color CSS no soportadas
 * - Las funciones safeSetStyle filtran colores como lab(), lch(), oklch(), etc.
 * - El tema se detecta automáticamente por la clase 'dark' en documentElement
 * 
 * @author Carlos Cusi
 * @date 2026-03-03
 */

/**
 * Utility functions for handling export functionality with CSS variable compatibility
 */

export interface ExportOptions {
  backgroundColor?: string;
  scale?: number;
  useCORS?: boolean;
  logging?: boolean;
  filename?: string;
}

/**
 * Converts CSS variables to computed values for better html2canvas compatibility
 */
export const prepareExportStyles = (element: HTMLElement): void => {
  const elements = element.querySelectorAll('*');
  elements.forEach(el => {
    if (el instanceof HTMLElement) {
      const computedStyle = window.getComputedStyle(el);
      
      // Apply computed styles to avoid CSS variable issues
      el.style.color = computedStyle.color;
      el.style.backgroundColor = computedStyle.backgroundColor;
      el.style.borderColor = computedStyle.borderColor;
      el.style.borderTopColor = computedStyle.borderTopColor;
      el.style.borderRightColor = computedStyle.borderRightColor;
      el.style.borderBottomColor = computedStyle.borderBottomColor;
      el.style.borderLeftColor = computedStyle.borderLeftColor;
      
      // Handle text color and background color for better visibility
      if (computedStyle.color && computedStyle.color !== 'rgba(0, 0, 0, 0)') {
        el.style.color = computedStyle.color;
      }
      if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        el.style.backgroundColor = computedStyle.backgroundColor;
      }
    }
  });
};

/**
 * Restores original styles after export
 */
export const restoreExportStyles = (element: HTMLElement): void => {
  const elements = element.querySelectorAll('*');
  elements.forEach(el => {
    if (el instanceof HTMLElement) {
      // Reset inline styles that were modified
      el.style.color = '';
      el.style.backgroundColor = '';
      el.style.borderColor = '';
      el.style.borderTopColor = '';
      el.style.borderRightColor = '';
      el.style.borderBottomColor = '';
      el.style.borderLeftColor = '';
    }
  });
};

/**
 * Creates a deep clone of an element with computed styles for export
 */
export const createExportClone = (element: HTMLElement): HTMLElement => {
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Apply computed styles to the clone
  const originalElements = element.querySelectorAll('*');
  const cloneElements = clone.querySelectorAll('*');
  
  originalElements.forEach((originalEl, index) => {
    const cloneEl = cloneElements[index];
    if ((originalEl instanceof HTMLElement && cloneEl instanceof HTMLElement) ||
        (originalEl instanceof SVGElement && cloneEl instanceof SVGElement)) {
      const computedStyle = window.getComputedStyle(originalEl);

      const safeSetStyle = (prop: string, value: string) => {
        // Check for unsupported color functions and other problematic values
        if (typeof value === 'string') {
            // Skip if value is empty or transparent
            if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'inherit') {
                return;
            }

            // Normalize the value for checking
            const normalizedValue = value.trim().toLowerCase();
            
            // Special case: handle "color" as a standalone value (CSS keyword)
            if (normalizedValue === 'color') {
                console.warn(`Skipping unsupported color value in ${prop}: ${value}`);
                if (prop.includes('color') || prop.includes('Color') || prop === 'fill' || prop === 'stroke') {
                    cloneEl.style.setProperty(prop, 'var(--color-grey-800)');
                }
                return;
            }

            // List of unsupported color functions in html2canvas
            const unsupportedColorFunctions = [
                'color(',       // CSS Color Level 4 color() function
                ' lab(',        // Lab color space (with space to avoid matching 'color')
                ' lch(',        // LCH color space
                ' oklab(',      // OKLab color space
                ' oklch(',      // OKLCH color space
                'color-mix(',   // color-mix() function
                ' hwb(',        // HWB color
                ' ictcp(',      // ICtCp color
            ];

            // Check if value contains any unsupported color function
            const hasUnsupportedFunction = unsupportedColorFunctions.some(fn => 
                value.toLowerCase().includes(fn)
            );

            if (hasUnsupportedFunction) {
                console.warn(`Skipping unsupported color function in ${prop}: ${value}`);
                // Replace with a safe fallback color for color-related properties
                if (prop.includes('color') || prop.includes('Color') || prop === 'fill' || prop === 'stroke') {
                    cloneEl.style.setProperty(prop, 'var(--color-grey-800)');
                }
                return;
            }

            // Also check for functions at the start (like "color(" without space)
            if (/^color\s*\(/.test(value) || 
                /^lab\s*\(/.test(value) ||
                /^lch\s*\(/.test(value) ||
                /^oklab\s*\(/.test(value) ||
                /^oklch\s*\(/.test(value) ||
                /^color-mix\s*\(/.test(value) ||
                /^hwb\s*\(/.test(value) ||
                /^ictcp\s*\(/.test(value)) {
                console.warn(`Skipping unsupported color function at start in ${prop}: ${value}`);
                if (prop.includes('color') || prop.includes('Color') || prop === 'fill' || prop === 'stroke') {
                    cloneEl.style.setProperty(prop, 'var(--color-grey-800)');
                }
                return;
            }

            // Skip if value is a CSS variable that might resolve to an unsupported function
            if (value.startsWith('var(')) {
                try {
                    // Try to resolve the CSS variable
                    const cssVarName = value.replace(/var\(|\)/g, '').trim();
                    const resolvedValue = getComputedStyle(document.documentElement).getPropertyValue(cssVarName).trim();

                    // If resolved value is empty or contains unsupported functions, skip it
                    if (!resolvedValue || unsupportedColorFunctions.some(fn => resolvedValue.toLowerCase().includes(fn)) ||
                        /^color\s*\(/.test(resolvedValue) || 
                        /^lab\s*\(/.test(resolvedValue) ||
                        /^lch\s*\(/.test(resolvedValue)) {
                        console.warn(`Skipping CSS variable ${value} that resolves to unsupported color: ${resolvedValue || 'empty'}`);
                        if (prop.includes('color') || prop.includes('Color') || prop === 'fill' || prop === 'stroke') {
                            cloneEl.style.setProperty(prop, 'var(--color-grey-800)');
                        }
                        return;
                    }

                    // If resolved successfully and is safe, use the resolved value
                    cloneEl.style.setProperty(prop, resolvedValue);
                    return;
                } catch (e) {
                    console.warn(`Could not resolve CSS variable ${value}:`, e);
                }
            }

            // For regular values that passed all checks, apply them
            cloneEl.style.setProperty(prop, value);
        }
      };

      // Apply all computed styles defensively
      safeSetStyle('color', computedStyle.color);
      safeSetStyle('backgroundColor', computedStyle.backgroundColor);
      safeSetStyle('borderColor', computedStyle.borderColor);
      safeSetStyle('borderTopColor', computedStyle.borderTopColor);
      safeSetStyle('borderRightColor', computedStyle.borderRightColor);
      safeSetStyle('borderBottomColor', computedStyle.borderBottomColor);
      safeSetStyle('borderLeftColor', computedStyle.borderLeftColor);

      // For SVG elements, also handle fill and stroke
      if (originalEl instanceof SVGElement) {
        safeSetStyle('fill', computedStyle.fill);
        safeSetStyle('stroke', computedStyle.stroke);
      }

      // Copy other important styles
      cloneEl.style.fontFamily = computedStyle.fontFamily;
      cloneEl.style.fontSize = computedStyle.fontSize;
      cloneEl.style.fontWeight = computedStyle.fontWeight;
      cloneEl.style.textAlign = computedStyle.textAlign;
      cloneEl.style.verticalAlign = computedStyle.verticalAlign;
    }
  });
  
  return clone;
};

/**
 * Safe export function that handles CSS variables and other compatibility issues
 */
export const safeExportToCanvas = async (
  element: HTMLElement, 
  options: ExportOptions = {}
): Promise<HTMLCanvasElement> => {
  const {
    backgroundColor: bgColorInput,
    scale = 3, // Use a higher scale for better quality
    useCORS = true,
    logging = true // Enable logging to help debug
  } = options;

  try {
    // A brief delay to allow for final DOM updates and animations to settle.
    await new Promise(resolve => setTimeout(resolve, 500));

    const html2canvas = (await import('html2canvas')).default;
    
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    let resolvedBgColor: string;

    if (bgColorInput) {
      resolvedBgColor = bgColorInput;
    } else {
      const varName = theme === 'dark' ? '--color-bg-dark' : '--color-bg-secondary';
      resolvedBgColor = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    if (!resolvedBgColor || resolvedBgColor.startsWith('var(')) {
      resolvedBgColor = theme === 'dark' ? '#0f172a' : '#f8fafc';
    }

    const canvas = await html2canvas(element, {
      backgroundColor: resolvedBgColor,
      scale,
      useCORS,
      logging,
    });

    return canvas;
  } catch (error) {
    console.error("Error in safeExportToCanvas:", error);
    // Return a blank canvas or throw an error to indicate failure
    throw new Error('Failed to capture canvas.');
  }
};

/**
 * Export to PNG with error handling
 */
export const exportToPNG = async (
  element: HTMLElement, 
  filename: string = 'export'
): Promise<void> => {
  try {
    const canvas = await safeExportToCanvas(element);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    throw new Error('Failed to export to PNG. Please try again.');
  }
};

/**
 * Export to PDF with error handling
 */
export const exportToPDF = async (
  element: HTMLElement, 
  filename: string = 'export'
): Promise<void> => {
  try {
    const canvas = await safeExportToCanvas(element);
    const jsPDF = (await import('jspdf')).default;
    
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Failed to export to PDF. Please try again.');
  }
};