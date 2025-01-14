import { IsBoolean, IsDefined, IsMongoId } from 'class-validator';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class ChangeWorkflowActiveStatusCommand extends EnvironmentWithUserCommand {
  @IsBoolean()
  @IsDefined()
  active: boolean;

  @IsMongoId()
  @IsDefined()
  workflowId: string;
}
