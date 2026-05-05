import React from 'react';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IconLibrary = 'feather' | 'ion' | 'mci';

interface IconDef {
  lib: IconLibrary;
  name: string;
}

// Semantic icon registry — single source of truth for all icons in the app
const ICON_MAP: Record<string, IconDef> = {
  // Navigation
  home:           { lib: 'feather', name: 'home' },
  store:          { lib: 'mci',     name: 'storefront-outline' },
  cart:           { lib: 'feather', name: 'shopping-cart' },
  bag:            { lib: 'feather', name: 'shopping-bag' },
  search:         { lib: 'feather', name: 'search' },
  back:           { lib: 'feather', name: 'arrow-left' },
  forward:        { lib: 'feather', name: 'arrow-right' },
  chevronLeft:    { lib: 'feather', name: 'chevron-left' },
  chevronRight:   { lib: 'feather', name: 'chevron-right' },
  chevronDown:    { lib: 'feather', name: 'chevron-down' },
  chevronUp:      { lib: 'feather', name: 'chevron-up' },
  close:          { lib: 'feather', name: 'x' },
  menu:           { lib: 'feather', name: 'menu' },

  // Actions
  plus:           { lib: 'feather', name: 'plus' },
  minus:          { lib: 'feather', name: 'minus' },
  edit:           { lib: 'feather', name: 'edit-2' },
  trash:          { lib: 'feather', name: 'trash-2' },
  share:          { lib: 'feather', name: 'share-2' },
  filter:         { lib: 'feather', name: 'sliders' },
  sort:           { lib: 'mci',     name: 'sort-variant' },
  refresh:        { lib: 'feather', name: 'refresh-cw' },
  download:       { lib: 'feather', name: 'download' },
  copy:           { lib: 'feather', name: 'copy' },

  // User & Profile
  user:           { lib: 'feather', name: 'user' },
  users:          { lib: 'feather', name: 'users' },
  userCircle:     { lib: 'mci',     name: 'account-circle-outline' },
  logout:         { lib: 'feather', name: 'log-out' },
  settings:       { lib: 'feather', name: 'settings' },
  language:       { lib: 'ion',     name: 'language-outline' },

  // Health & Medical
  pregnancy:      { lib: 'mci',     name: 'human-pregnant' },
  pill:           { lib: 'mci',     name: 'pill' },
  prescription:   { lib: 'mci',     name: 'file-document-outline' },
  stethoscope:    { lib: 'mci',     name: 'stethoscope' },
  heartPulse:     { lib: 'mci',     name: 'heart-pulse' },
  medicalBag:     { lib: 'mci',     name: 'medical-bag' },
  pharmacist:     { lib: 'mci',     name: 'account-heart-outline' },
  bloodDrop:      { lib: 'mci',     name: 'water-outline' },
  flask:          { lib: 'mci',     name: 'flask-outline' },
  bandage:        { lib: 'mci',     name: 'bandage' },
  baby:           { lib: 'mci',     name: 'baby-face-outline' },
  babyCarriage:   { lib: 'mci',     name: 'baby-carriage' },
  babyBottle:     { lib: 'mci',     name: 'baby-bottle-outline' },
  skincare:       { lib: 'mci',     name: 'face-woman-shimmer' },
  activity:       { lib: 'feather', name: 'activity' },
  calendarHeart:  { lib: 'mci',     name: 'calendar-heart' },
  shieldCheck:    { lib: 'mci',     name: 'shield-check-outline' },

  // E-commerce
  creditCard:     { lib: 'feather', name: 'credit-card' },
  tag:            { lib: 'feather', name: 'tag' },
  percent:        { lib: 'feather', name: 'percent' },
  gift:           { lib: 'feather', name: 'gift' },
  package:        { lib: 'feather', name: 'package' },
  truck:          { lib: 'mci',     name: 'truck-delivery-outline' },
  star:           { lib: 'feather', name: 'star' },

  // Communication
  bell:           { lib: 'feather', name: 'bell' },
  bellOff:        { lib: 'feather', name: 'bell-off' },
  mail:           { lib: 'feather', name: 'mail' },
  phone:          { lib: 'feather', name: 'phone' },
  video:          { lib: 'feather', name: 'video' },
  messageCircle:  { lib: 'feather', name: 'message-circle' },
  chat:           { lib: 'ion',     name: 'chatbubble-outline' },
  whatsapp:       { lib: 'ion',     name: 'logo-whatsapp' },

  // Files & Documents
  camera:         { lib: 'feather', name: 'camera' },
  image:          { lib: 'feather', name: 'image' },
  folder:         { lib: 'feather', name: 'folder' },
  file:           { lib: 'feather', name: 'file' },
  fileText:       { lib: 'feather', name: 'file-text' },
  clipboard:      { lib: 'feather', name: 'clipboard' },
  upload:         { lib: 'feather', name: 'upload' },

  // Location
  mapPin:         { lib: 'feather', name: 'map-pin' },
  navigation:     { lib: 'feather', name: 'navigation' },
  globe:          { lib: 'feather', name: 'globe' },

  // Status & Info
  check:          { lib: 'feather', name: 'check' },
  checkCircle:    { lib: 'feather', name: 'check-circle' },
  alertCircle:    { lib: 'feather', name: 'alert-circle' },
  alertTriangle:  { lib: 'feather', name: 'alert-triangle' },
  info:           { lib: 'feather', name: 'info' },
  helpCircle:     { lib: 'feather', name: 'help-circle' },
  xCircle:        { lib: 'feather', name: 'x-circle' },

  // Security & Privacy
  lock:           { lib: 'feather', name: 'lock' },
  unlock:         { lib: 'feather', name: 'unlock' },
  shield:         { lib: 'feather', name: 'shield' },
  eye:            { lib: 'feather', name: 'eye' },
  eyeOff:         { lib: 'feather', name: 'eye-off' },

  // Time
  clock:          { lib: 'feather', name: 'clock' },
  calendar:       { lib: 'feather', name: 'calendar' },

  // Misc
  heart:          { lib: 'feather', name: 'heart' },
  flash:          { lib: 'ion',     name: 'flash-outline' },
  rocket:         { lib: 'ion',     name: 'rocket-outline' },
  sparkles:       { lib: 'ion',     name: 'sparkles-outline' },
  celebration:    { lib: 'mci',     name: 'party-popper' },
  handWave:       { lib: 'mci',     name: 'hand-wave-outline' },
  smartphone:     { lib: 'feather', name: 'smartphone' },
  appleLogo:      { lib: 'ion',     name: 'logo-apple' },
  externalLink:   { lib: 'feather', name: 'external-link' },
  arrowUpRight:   { lib: 'feather', name: 'arrow-up-right' },
  moreHorizontal: { lib: 'feather', name: 'more-horizontal' },
  hash:           { lib: 'feather', name: 'hash' },
  barChart:       { lib: 'feather', name: 'bar-chart-2' },
};

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 22, color = Colors.text, style }: IconProps) {
  const def = ICON_MAP[name];
  if (!def) {
    return null;
  }

  switch (def.lib) {
    case 'feather':
      return <Feather name={def.name as any} size={size} color={color} style={style} />;
    case 'ion':
      return <Ionicons name={def.name as any} size={size} color={color} style={style} />;
    case 'mci':
      return <MaterialCommunityIcons name={def.name as any} size={size} color={color} style={style} />;
    default:
      return null;
  }
}

export default Icon;
