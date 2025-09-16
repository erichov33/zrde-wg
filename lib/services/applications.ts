// Create centralized data service
export class ApplicationsService {
  async getApplications(filters?: ApplicationFilters): Promise<Application[]>
  async getApplication(id: string): Promise<ApplicationDetail>
  async updateApplicationStatus(id: string, status: ApplicationStatus): Promise<void>
}