# Mobile App Bold Text Styling Fix

## Issue
The color styling is working correctly between the webapp and mobile app, but the bold text styling is not being applied properly on the mobile app side.

## Problem Analysis
The webapp is correctly storing and transmitting the bold styling data. Here's what the API returns:

```json
{
  "title_bold": true,
  "date_bold": false,
  "time_bold": false,
  "location_bold": false,
  "description_bold": true,
  "price_bold": false,
  "button_text_bold": false
}
```

## Required Fix
The mobile app template needs to properly implement the bold styling for all text elements.

## Implementation Examples

### React Native
```javascript
// Event Title
<Text style={{
  fontSize: 24,
  fontWeight: event.title_bold ? 'bold' : 'normal',
  color: event.title_color || '#ffffff'
}}>
  {event.title}
</Text>

// Event Date
{event.date && event.date.trim() && (
  <Text style={{
    fontSize: 16,
    fontWeight: event.date_bold ? 'bold' : 'normal',
    color: event.date_color || '#000000'
  }}>
    {event.date}
  </Text>
)}

// Event Description
<Text style={{
  fontSize: 14,
  fontWeight: event.description_bold ? 'bold' : 'normal',
  color: event.description_color || '#000000'
}}>
  {event.description}
</Text>

// Button Text
<TouchableOpacity>
  <Text style={{
    fontSize: 16,
    fontWeight: event.button_text_bold ? 'bold' : 'normal',
    color: event.button_text_color || '#ffffff'
  }}>
    {event.link_text}
  </Text>
</TouchableOpacity>
```

### Flutter
```dart
// Event Title
Text(
  event.title,
  style: TextStyle(
    fontSize: 24,
    fontWeight: event.titleBold ? FontWeight.bold : FontWeight.normal,
    color: Color(int.parse(event.titleColor.replaceFirst('#', '0xff'))),
  ),
)

// Event Date
if (event.date.isNotEmpty)
  Text(
    event.date,
    style: TextStyle(
      fontSize: 16,
      fontWeight: event.dateBold ? FontWeight.bold : FontWeight.normal,
      color: Color(int.parse(event.dateColor.replaceFirst('#', '0xff'))),
    ),
  )

// Event Description
Text(
  event.description,
  style: TextStyle(
    fontSize: 14,
    fontWeight: event.descriptionBold ? FontWeight.bold : FontWeight.normal,
    color: Color(int.parse(event.descriptionColor.replaceFirst('#', '0xff'))),
  ),
)
```

### Swift (iOS)
```swift
// Event Title
let titleLabel = UILabel()
titleLabel.text = event.title
titleLabel.font = event.titleBold ? UIFont.boldSystemFont(ofSize: 24) : UIFont.systemFont(ofSize: 24)
titleLabel.textColor = UIColor(hex: event.titleColor)

// Event Date
if !event.date.isEmpty {
    let dateLabel = UILabel()
    dateLabel.text = event.date
    dateLabel.font = event.dateBold ? UIFont.boldSystemFont(ofSize: 16) : UIFont.systemFont(ofSize: 16)
    dateLabel.textColor = UIColor(hex: event.dateColor)
}

// Event Description
let descriptionLabel = UILabel()
descriptionLabel.text = event.description
descriptionLabel.font = event.descriptionBold ? UIFont.boldSystemFont(ofSize: 14) : UIFont.systemFont(ofSize: 14)
descriptionLabel.textColor = UIColor(hex: event.descriptionColor)
```

### Kotlin (Android)
```kotlin
// Event Title
val titleTextView = TextView(context)
titleTextView.text = event.title
titleTextView.typeface = if (event.titleBold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
titleTextView.setTextColor(Color.parseColor(event.titleColor))

// Event Date
if (event.date.isNotEmpty()) {
    val dateTextView = TextView(context)
    dateTextView.text = event.date
    dateTextView.typeface = if (event.dateBold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
    dateTextView.setTextColor(Color.parseColor(event.dateColor))
}

// Event Description
val descriptionTextView = TextView(context)
descriptionTextView.text = event.description
descriptionTextView.typeface = if (event.descriptionBold) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
descriptionTextView.setTextColor(Color.parseColor(event.descriptionColor))
```

## Testing Checklist
- [ ] Test with events where `title_bold: true`
- [ ] Test with events where `description_bold: true`
- [ ] Test with events where `date_bold: true`
- [ ] Test with events where `time_bold: true`
- [ ] Test with events where `location_bold: true`
- [ ] Test with events where `price_bold: true`
- [ ] Test with events where `button_text_bold: true`
- [ ] Verify bold styling works for all text elements
- [ ] Test with events where bold fields are `false` (should be normal weight)
- [ ] Test with events where bold fields are `null` (should default to normal weight)

## Data Verification
The API endpoint `/api/events` returns all styling fields correctly. You can verify the data structure by checking:
- `title_bold`: boolean
- `date_bold`: boolean  
- `time_bold`: boolean
- `location_bold`: boolean
- `description_bold`: boolean
- `price_bold`: boolean
- `button_text_bold`: boolean

## Expected Result
After implementing these changes, all text elements in the mobile app should respect the bold styling settings from the webapp, showing bold text when the corresponding `*_bold` field is `true` and normal weight when it's `false`.
