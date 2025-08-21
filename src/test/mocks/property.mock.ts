import { Property } from '../../lib/types/property';

export class MockPropertyRepository {
  private static instance: MockPropertyRepository;
  private properties: Map<string, Property>;

  private constructor() {
    this.properties = new Map();
    this.initializeTestData();
  }

  static getInstance(): MockPropertyRepository {
    if (!MockPropertyRepository.instance) {
      MockPropertyRepository.instance = new MockPropertyRepository();
    }
    return MockPropertyRepository.instance;
  }

  private initializeTestData() {
    const testProperties: Property[] = [
      {
        id: 'property-123',
        name: 'Test Property 1',
      },
      {
        id: 'property-456',
        name: 'Test Property 2',
      },
    ];

    testProperties.forEach(property => {
      this.properties.set(property.id, property);
    });
  }

  async getProperty(id: string): Promise<Property | null> {
    return this.properties.get(id) || null;
  }

  async addProperty(property: Property): Promise<void> {
    this.properties.set(property.id, property);
  }

  async reset(): Promise<void> {
    this.properties.clear();
    this.initializeTestData();
  }
}

export const mockPropertyRepository = MockPropertyRepository.getInstance();
