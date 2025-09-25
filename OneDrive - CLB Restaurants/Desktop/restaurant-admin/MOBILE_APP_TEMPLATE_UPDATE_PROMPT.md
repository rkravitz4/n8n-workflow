# Mobile App Template Update Prompt for AI Agent

## Overview
The Tucci's restaurant webapp has been updated to simplify the event management system and add text styling capabilities. The mobile app template needs to be updated to reflect these changes.

## Database Schema Changes

### Removed Fields
The following fields have been **REMOVED** from the events table:
- `event_details` (was optional detailed event information)
- `music_schedule` (was optional music schedule)

### Added Styling Fields
The following new styling fields have been **ADDED** for each text field:

**For Event Title:**
- `title_color` (TEXT): Color of the title text
- `title_bold` (BOOLEAN): Whether the title text is bold

**For Date:**
- `date_color` (TEXT): Color of the date text
- `date_bold` (BOOLEAN): Whether the date text is bold

**For Time:**
- `time_color` (TEXT): Color of the time text
- `time_bold` (BOOLEAN): Whether the time text is bold

**For Location:**
- `location_color` (TEXT): Color of the location text
- `location_bold` (BOOLEAN): Whether the location text is bold

**For Description:**
- `description_color` (TEXT): Color of the description text
- `description_bold` (BOOLEAN): Whether the description text is bold

**For Price:**
- `price_color` (TEXT): Color of the price text
- `price_bold` (BOOLEAN): Whether the price text is bold

**For Button Text:**
- `button_text_color` (TEXT): Color of the button text
- `button_text_bold` (BOOLEAN): Whether the button text is bold

## Available Colors
The color values are restricted to these four options:
- **Black**: `#000000`
- **White**: `#ffffff`
- **Maroon**: `#810000`
- **Gold**: `#ab974f`

## Default Values
If the styling fields are null or undefined, use these defaults:
- `title_color`: `#ffffff` (white)
- `title_bold`: `false`
- `date_color`: `#000000` (black)
- `date_bold`: `false`
- `time_color`: `#000000` (black)
- `time_bold`: `false`
- `location_color`: `#000000` (black)
- `location_bold`: `false`
- `description_color`: `#000000` (black)
- `description_bold`: `false`
- `price_color`: `#810000` (maroon)
- `price_bold`: `false`
- `button_text_color`: `#ffffff` (white)
- `button_text_bold`: `false`

## Updated Event Fields Structure

The simplified event structure now includes only these fields:

### Required Fields:
1. **Event Title** - Main event name
2. **Location** - Event location
3. **Description** - Event description
4. **Hero Image Upload** - Main event image
5. **App Page Navigation** - Which page to navigate to when button is tapped
6. **Button Text** - Text displayed on the action button
7. **Seating Type** - "open" or "limited" seating

### Optional Fields:
- **Date** - Event date (text format) - if empty, date will not display
- **Time** - Event time (text format) - if empty, time will not display
- **Price** - Event price - if empty, price will not display
- **Reservation Button** - OpenTable URL for reservation links

## Template Implementation Requirements

### 1. Remove Old Sections
- **Remove** any sections that display `event_details` content
- **Remove** any sections that display `music_schedule` content

### 2. Apply Text Styling
For each text element in the template, apply the corresponding styling:

```javascript
// Example implementation for title
const titleStyle = {
  color: event.title_color || '#ffffff',
  fontWeight: event.title_bold ? 'bold' : 'normal'
};

// Example implementation for date
const dateStyle = {
  color: event.date_color || '#000000',
  fontWeight: event.date_bold ? 'bold' : 'normal'
};

// Continue for all text fields...
```

### 3. Template Layout Structure
The template should display content in this order:
1. **Hero Image** (full width)
2. **Event Title** (with styling applied)
3. **Event Details Row**: Date, Time, Location (only show if not empty, each with individual styling)
4. **Description** (with styling applied)
5. **Price** (if present, with styling applied)
6. **Action Button** (with styling applied to button text)
7. **Reservation Button** (if OpenTable URL is provided)

### 4. Conditional Display Logic
Implement conditional rendering for optional fields:

```javascript
// Example conditional rendering
{event.date && event.date.trim() && (
  <div className="date-display">
    <Text style={dateStyle}>{event.date}</Text>
  </div>
)}

{event.time && event.time.trim() && (
  <div className="time-display">
    <Text style={timeStyle}>{event.time}</Text>
  </div>
)}

{event.price && event.price.trim() && (
  <div className="price-display">
    <Text style={priceStyle}>{event.price}</Text>
  </div>
)}
```

### 5. Styling Implementation Examples

**React Native StyleSheet:**
```javascript
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: event.title_bold ? 'bold' : 'normal',
    color: event.title_color || '#ffffff',
  },
  date: {
    fontSize: 16,
    fontWeight: event.date_bold ? 'bold' : 'normal',
    color: event.date_color || '#000000',
  },
  // Continue for all fields...
});
```

**Flutter TextStyle:**
```dart
TextStyle(
  fontSize: 24,
  fontWeight: event.titleBold ? FontWeight.bold : FontWeight.normal,
  color: Color(int.parse(event.titleColor.replaceFirst('#', '0xff'))),
)
```

### 6. Color Conversion
Ensure proper color conversion for your platform:
- **React Native**: Use hex colors directly
- **Flutter**: Convert hex to Color(int.parse('0xff' + hex.substring(1)))
- **Swift**: Convert hex to UIColor
- **Kotlin**: Convert hex to Color

### 7. Backward Compatibility
- Handle cases where styling fields might be null/undefined
- Use default values as specified above
- Ensure the template works with existing events that don't have styling data

### 8. Testing Requirements
- Test with events that have all styling fields set
- Test with events that have no styling fields (should use defaults)
- Test with events that have partial styling fields
- Verify all four colors display correctly
- Verify bold/normal text weight works correctly

## Migration Notes
- Existing events in the database will have null values for the new styling fields
- The template should gracefully handle these null values by using the default values
- No data migration is needed as defaults are handled in the template

## Questions for Implementation
1. What platform is the mobile app built on? (React Native, Flutter, native iOS/Android)
2. Are there any existing styling constraints or design system requirements?
3. Should the styling be applied to all text elements or only specific ones?
4. Are there any accessibility considerations for the color choices?

## Expected Outcome
After implementing these changes:
- The mobile app template will display events with the simplified field structure
- All text elements will respect the color and bold styling from the webapp
- The template will be more maintainable with fewer optional fields
- Event creation and editing will be more user-friendly on the webapp side
