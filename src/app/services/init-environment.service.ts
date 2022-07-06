import { EnvironmentsService } from '@services/utility/environments.service';

export function initEnvironment(_env: EnvironmentsService) {
  return () => _env.setNetwork();
}
