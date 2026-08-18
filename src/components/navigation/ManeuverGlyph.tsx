import React from 'react';
import { ManeuverType } from '../../types';

interface ManeuverGlyphProps {
  type: ManeuverType;
  color?: string;
  className?: string;
}

/**
 * High-contrast, bold automotive maneuver vector arrows.
 * Glanceable primary navigation cues following standard automotive HMI conventions.
 * Strictly non-pulsing and static.
 */
export const ManeuverGlyph: React.FC<ManeuverGlyphProps> = ({
  type,
  color = 'currentColor',
  className = '',
}) => {
  switch (type) {
    case 'straight':
      return (
        <g className={className} id="maneuver-glyph-straight">
          {/* Vertical shaft and bold arrowhead pointing straight ahead */}
          <path
            d="M 160 135 L 215 190 L 180 190 L 180 300 L 140 300 L 140 190 L 105 190 Z"
            fill={color}
          />
        </g>
      );

    case 'slight-left':
      return (
        <g className={className} id="maneuver-glyph-slight-left">
          {/* Slight left curved diagonal arrow */}
          <path
            d="M 120 140 L 180 150 L 158 178 Q 170 230 160 300 L 132 300 Q 138 238 128 198 L 100 206 Z"
            fill={color}
          />
        </g>
      );

    case 'slight-right':
      return (
        <g className={className} id="maneuver-glyph-slight-right">
          {/* Slight right curved diagonal arrow */}
          <path
            d="M 200 140 L 220 206 L 192 198 Q 182 238 188 300 L 160 300 Q 150 230 162 178 L 140 150 Z"
            fill={color}
          />
        </g>
      );

    case 'left':
      return (
        <g className={className} id="maneuver-glyph-left">
          {/* 90-degree left turn maneuver arrow */}
          <path
            d="M 95 185 L 155 135 L 155 168 Q 195 170 195 210 L 195 300 L 165 300 L 165 218 Q 165 198 140 198 L 155 198 L 155 235 Z"
            fill={color}
          />
        </g>
      );

    case 'right':
      return (
        <g className={className} id="maneuver-glyph-right">
          {/* 90-degree right turn maneuver arrow */}
          <path
            d="M 225 185 L 165 235 L 165 198 L 180 198 Q 155 198 155 218 L 155 300 L 125 300 L 125 210 Q 125 170 165 168 L 165 135 Z"
            fill={color}
          />
        </g>
      );

    // Follow-up extensions (fallback safe glyphs)
    case 'sharp-left':
      return (
        <g className={className} id="maneuver-glyph-sharp-left">
          <path
            d="M 85 220 L 145 155 L 145 190 Q 185 192 185 240 L 185 300 L 155 300 L 155 248 Q 155 220 135 220 L 145 255 Z"
            fill={color}
          />
        </g>
      );

    case 'sharp-right':
      return (
        <g className={className} id="maneuver-glyph-sharp-right">
          <path
            d="M 235 220 L 175 255 L 185 220 Q 165 220 165 248 L 165 300 L 135 300 L 135 240 Q 135 192 175 190 L 175 155 Z"
            fill={color}
          />
        </g>
      );

    case 'u-turn-left':
    case 'u-turn-right':
      return (
        <g className={className} id="maneuver-glyph-u-turn">
          <path
            d="M 120 250 L 85 195 L 115 195 L 115 165 Q 115 135 160 135 Q 205 135 205 165 L 205 300 L 175 300 L 175 165 Q 175 155 160 155 Q 145 155 145 165 L 145 195 L 155 195 Z"
            fill={color}
          />
        </g>
      );

    case 'arrive':
      return (
        <g className={className} id="maneuver-glyph-arrive">
          {/* Destination Pin / Flag glyph */}
          <path
            d="M 160 140 C 140 140 125 155 125 175 C 125 205 160 255 160 255 C 160 255 195 205 195 175 C 195 155 180 140 160 140 Z M 160 190 C 151.7 190 145 183.3 145 175 C 145 166.7 151.7 160 160 160 C 168.3 160 175 166.7 175 175 C 175 183.3 168.3 190 160 190 Z"
            fill={color}
          />
          <ellipse cx="160" cy="275" rx="35" ry="8" fill={color} opacity="0.4" />
        </g>
      );

    default:
      return (
        <g className={className} id="maneuver-glyph-default">
          <path
            d="M 160 135 L 215 190 L 180 190 L 180 300 L 140 300 L 140 190 L 105 190 Z"
            fill={color}
          />
        </g>
      );
  }
};
