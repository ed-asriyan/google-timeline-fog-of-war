# Clean Architecture - Google Timeline Fog of War

This document describes the architectural principles and structure of the refactored codebase.

## 🏛️ Architecture Overview

The application follows **Clean Architecture** principles (inspired by Domain-Driven Design) with clear separation of concerns across four distinct layers:

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                    │
│              (React Components & Hooks)                 │
├────────────────────────────────────────────────────────┤
│                   Application Layer                     │
│                (Use Cases & Services)                   │
├────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                   │
│         (External Systems, Parsers, Storage)            │
├────────────────────────────────────────────────────────┤
│                     Domain Layer                        │
│           (Entities, Value Objects, Services)           │
└────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Dependency Rule**: Dependencies point inward. Domain has no dependencies. Infrastructure depends on domain, etc.
2. **Separation of Concerns**: Each layer has a single responsibility
3. **Testability**: Pure business logic isolated from framework code
4. **Flexibility**: Easy to swap implementations (e.g., different storage backends)

## 📁 Project Structure

```
src/
├── domain/                      # Core business logic (no dependencies)
│   ├── entities.ts              # Domain entities (LocationPoint, TimelineFile, etc.)
│   ├── value-objects.ts         # Immutable values (FogSettings)
│   └── services.ts              # Domain services (GeographyService)
│
├── application/                 # Use cases and application services
│   ├── timeline-file-service.ts # File management use case
│   └── settings-service.ts      # Settings management use case
│
├── infrastructure/              # External systems and implementations
│   ├── parsers/
│   │   └── timeline-parser.ts   # iOS & Android format parsers
│   ├── repositories/
│   │   ├── timeline-file-repository.ts  # IndexedDB implementation
│   │   └── settings-repository.ts       # localStorage implementation
│   └── service-container.ts     # Dependency injection container
│
├── presentation/                # UI layer (React specific)
│   ├── components/              # React components
│   │   ├── ControlPanel.tsx
│   │   ├── FileList.tsx
│   │   ├── FileUpload.tsx
│   │   └── SidePanel.tsx
│   └── hooks/                   # Custom React hooks
│       ├── useFogSettings.ts
│       ├── useMap.ts
│       └── useTimelineFiles.ts
│
├── test/                        # Test files
│   ├── domain.test.ts
│   ├── parser.test.ts
│   └── storage.test.ts
│
├── App.tsx                      # Main application entry
└── main.tsx                     # React bootstrap
```

## 🔷 Layer Descriptions

### 1. Domain Layer (Core Business Logic)

**Principle**: Pure business logic with zero external dependencies.

#### Entities (`domain/entities.ts`)
Rich domain objects that encapsulate business rules:

- `LocationPoint`: Geographic coordinates with validation
- `LocationSegment`: Path between two points
- `TimelineData`: Collection of points and segments
- `TimelineFile`: Timeline file with metadata

**Example**:
```typescript
const point = new LocationPoint(47.6062, -122.3321);
// Throws error for invalid coordinates
const invalid = new LocationPoint(1000, 0); // ❌ Throws Error
```

#### Value Objects (`domain/value-objects.ts`)
Immutable configuration objects:

- `FogSettings`: Visualization settings (immutable)

**Example**:
```typescript
const settings = FogSettings.default();
const updated = settings.withRadius(1.5); // Returns new instance
```

#### Domain Services (`domain/services.ts`)
Stateless services for domain operations:

- `GeographyService`: Geographic calculations (Haversine distance)

### 2. Application Layer (Use Cases)

**Principle**: Orchestrates domain objects to fulfill application requirements.

#### Timeline File Service (`application/timeline-file-service.ts`)
Coordinates file upload, parsing, and storage operations.

**Key Methods**:
- `uploadFiles(files: File[]): Promise<TimelineFile[]>`
- `loadAll(): Promise<TimelineFile[]>`
- `remove(id: string): Promise<void>`
- `getAggregatedData(files): Promise<TimelineData>`

#### Settings Service (`application/settings-service.ts`)
Manages application settings with persistence.

**Key Methods**:
- `updateRadius(settings, radius): FogSettings`
- `toggleRoads(settings): FogSettings`
- `resetToDefaults(): FogSettings`

### 3. Infrastructure Layer (External Systems)

**Principle**: Implements interfaces for external systems and frameworks.

#### Parsers (`infrastructure/parsers/timeline-parser.ts`)
Multi-format timeline parsing with strategy pattern:

- `IOSTimelineParser`: Parses iOS format (`geo:lat,lon`)
- `AndroidTimelineParser`: Parses Android format (`"lat°, lon°"`)
- `TimelineParserFactory`: Auto-detects and selects appropriate parser

**Example**:
```typescript
const data = TimelineParserFactory.parse(json); // Auto-detects format
const format = TimelineParserFactory.detectFormat(json); // 'ios' | 'android'
```

#### Repositories (`infrastructure/repositories/`)
Abstraction over storage mechanisms:

- `TimelineFileRepository`: IndexedDB for file storage
- `SettingsRepository`: localStorage for settings

#### Service Container (`infrastructure/service-container.ts`)
Dependency injection container (Singleton pattern):

```typescript
const container = ServiceContainer.getInstance();
const service = container.timelineFileService;
```

### 4. Presentation Layer (UI)

**Principle**: React-specific code, isolated from business logic.

#### Custom Hooks (`presentation/hooks/`)
Encapsulate state management and side effects:

- `useTimelineFiles`: File management state
- `useFogSettings`: Settings management state
- `useMap`: Map rendering and fog overlay

**Example**:
```typescript
const { files, uploadFiles, removeFile } = useTimelineFiles(service);
```

#### Components (`presentation/components/`)
Pure presentational components:

- `SidePanel`: Main control panel container
- `ControlPanel`: Settings controls
- `FileList`: File list display
- `FileUpload`: File upload UI

## 🎯 Design Patterns Used

### 1. Repository Pattern
Abstracts data access:
```typescript
interface Repository<T> {
  save(item: T): Promise<void>;
  getAll(): Promise<T[]>;
  remove(id: string): Promise<void>;
}
```

### 2. Strategy Pattern
Different parsers for different formats:
```typescript
interface ITimelineParser {
  canParse(data: any): boolean;
  parse(data: any): TimelineData;
}
```

### 3. Factory Pattern
Creates appropriate parser based on data:
```typescript
TimelineParserFactory.parse(data); // Auto-selects parser
```

### 4. Service Layer Pattern
Use cases orchestrate domain logic:
```typescript
class TimelineFileService {
  constructor(private repository: TimelineFileRepository) {}
  async uploadFiles(files: File[]): Promise<TimelineFile[]> { ... }
}
```

### 5. Dependency Injection
Services receive dependencies via constructor:
```typescript
const repository = new TimelineFileRepository();
const service = new TimelineFileService(repository);
```

### 6. Immutable Value Objects
Settings never mutate, always create new instances:
```typescript
const newSettings = settings.withRadius(2.0); // Returns new instance
```

## ✅ Benefits

### Maintainability
- **Clear boundaries**: Each layer has well-defined responsibilities
- **Easy navigation**: Predictable file organization
- **Self-documenting**: Structure reveals intent

### Testability
- **Domain layer**: Pure functions, easily tested
- **Mocked dependencies**: Services can be tested in isolation
- **24 passing tests**: Domain, parsers, storage

### Flexibility
- **Swap implementations**: Easy to change storage from IndexedDB to API
- **Add formats**: New parsers without touching existing code
- **UI framework independence**: Domain/application layers agnostic to React

### Scalability
- **Add features**: Clear place for new functionality
- **Team collaboration**: Developers work on different layers
- **Code reuse**: Domain logic reusable across platforms

## 📚 Example Workflow

### Adding a New Timeline Format

1. **Create Parser** (`infrastructure/parsers/`)
```typescript
export class NewFormatParser implements ITimelineParser {
  canParse(data: any): boolean { /* ... */ }
  parse(data: any): TimelineData { /* ... */ }
}
```

2. **Register in Factory**
```typescript
TimelineParserFactory.parsers.push(new NewFormatParser());
```

3. **Done!** No changes needed elsewhere.

### Changing Storage Backend

1. **Implement Repository Interface**
```typescript
export class APITimelineFileRepository {
  async save(file: TimelineFile): Promise<void> { /* API call */ }
  async getAll(): Promise<TimelineFile[]> { /* API call */ }
  async remove(id: string): Promise<void> { /* API call */ }
}
```

2. **Update Service Container**
```typescript
this._timelineFileRepository = new APITimelineFileRepository();
```

3. **Done!** Business logic unchanged.

## 🧪 Testing Strategy

### Domain Tests (`test/domain.test.ts`)
Test pure business logic:
- Entity validation
- Value object immutability
- Domain service calculations

### Integration Tests (`test/parser.test.ts`)
Test infrastructure with real data:
- iOS format parsing
- Android format parsing
- Format detection

### Mock Tests (`test/storage.test.ts`)
Test patterns without external dependencies

## 📖 Reading Guide for New Developers

**Start here**:
1. `domain/entities.ts` - Understand core business objects
2. `App.tsx` - See how everything connects
3. `application/` - Understand use cases
4. `presentation/hooks/` - See state management

**Flow**:
User Action → Hook → Service → Repository → Domain
