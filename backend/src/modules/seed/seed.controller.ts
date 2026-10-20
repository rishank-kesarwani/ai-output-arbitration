import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeedService, PreloadedScenario } from './seed.service';

@ApiTags('Test Scenarios')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('scenarios')
  @ApiOperation({ summary: 'List reproducible test console evaluation scenarios' })
  @ApiResponse({ status: 200, description: 'List of preloaded test scenarios' })
  getScenarios(): PreloadedScenario[] {
    return this.seedService.getScenarios();
  }

  @Get('scenarios/:id')
  @ApiOperation({ summary: 'Get scenario details by ID' })
  @ApiResponse({ status: 200, description: 'Scenario detail' })
  getScenario(@Param('id') id: string): PreloadedScenario {
    const sc = this.seedService.getScenarioById(id);
    if (!sc) {
      throw new NotFoundException(`Scenario with ID "${id}" not found.`);
    }
    return sc;
  }
}
