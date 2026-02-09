/**
 * Scenario Timeline Phases
 *
 * This file contains the timeline phases for each regime transformation scenario.
 * Each scenario shows a sequence of steps/phases that illustrate how that scenario could unfold.
 */

export interface TimelinePhase {
  title_key: string
  description_key: string
  phase_label_key: string
}

export interface ScenarioTimeline {
  scenario_key: string
  phases: TimelinePhase[]
}

/**
 * Timeline phases for all scenarios
 * Keys reference translations in i18n/[locale]/common.json under scenarioPhases.[scenario_key].phases[index]
 */
export const scenarioTimelines: ScenarioTimeline[] = [
  {
    scenario_key: 'democraticTransition',
    phases: [
      {
        title_key: 'scenarioPhases.democraticTransition.phases.0.title',
        description_key: 'scenarioPhases.democraticTransition.phases.0.description',
        phase_label_key: 'scenarioPhases.democraticTransition.phases.0.phase',
      },
      {
        title_key: 'scenarioPhases.democraticTransition.phases.1.title',
        description_key: 'scenarioPhases.democraticTransition.phases.1.description',
        phase_label_key: 'scenarioPhases.democraticTransition.phases.1.phase',
      },
      {
        title_key: 'scenarioPhases.democraticTransition.phases.2.title',
        description_key: 'scenarioPhases.democraticTransition.phases.2.description',
        phase_label_key: 'scenarioPhases.democraticTransition.phases.2.phase',
      },
      {
        title_key: 'scenarioPhases.democraticTransition.phases.3.title',
        description_key: 'scenarioPhases.democraticTransition.phases.3.description',
        phase_label_key: 'scenarioPhases.democraticTransition.phases.3.phase',
      },
      {
        title_key: 'scenarioPhases.democraticTransition.phases.4.title',
        description_key: 'scenarioPhases.democraticTransition.phases.4.description',
        phase_label_key: 'scenarioPhases.democraticTransition.phases.4.phase',
      },
    ],
  },
  {
    scenario_key: 'preemptedDemocraticTransition',
    phases: [
      {
        title_key: 'scenarioPhases.preemptedDemocraticTransition.phases.0.title',
        description_key: 'scenarioPhases.preemptedDemocraticTransition.phases.0.description',
        phase_label_key: 'scenarioPhases.preemptedDemocraticTransition.phases.0.phase',
      },
      {
        title_key: 'scenarioPhases.preemptedDemocraticTransition.phases.1.title',
        description_key: 'scenarioPhases.preemptedDemocraticTransition.phases.1.description',
        phase_label_key: 'scenarioPhases.preemptedDemocraticTransition.phases.1.phase',
      },
      {
        title_key: 'scenarioPhases.preemptedDemocraticTransition.phases.2.title',
        description_key: 'scenarioPhases.preemptedDemocraticTransition.phases.2.description',
        phase_label_key: 'scenarioPhases.preemptedDemocraticTransition.phases.2.phase',
      },
      {
        title_key: 'scenarioPhases.preemptedDemocraticTransition.phases.3.title',
        description_key: 'scenarioPhases.preemptedDemocraticTransition.phases.3.description',
        phase_label_key: 'scenarioPhases.preemptedDemocraticTransition.phases.3.phase',
      },
      {
        title_key: 'scenarioPhases.preemptedDemocraticTransition.phases.4.title',
        description_key: 'scenarioPhases.preemptedDemocraticTransition.phases.4.description',
        phase_label_key: 'scenarioPhases.preemptedDemocraticTransition.phases.4.phase',
      },
    ],
  },
  {
    scenario_key: 'stabilizedElectoralAutocracy',
    phases: [
      {
        title_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.0.title',
        description_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.0.description',
        phase_label_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.0.phase',
      },
      {
        title_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.1.title',
        description_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.1.description',
        phase_label_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.1.phase',
      },
      {
        title_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.2.title',
        description_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.2.description',
        phase_label_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.2.phase',
      },
      {
        title_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.3.title',
        description_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.3.description',
        phase_label_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.3.phase',
      },
      {
        title_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.4.title',
        description_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.4.description',
        phase_label_key: 'scenarioPhases.stabilizedElectoralAutocracy.phases.4.phase',
      },
    ],
  },
  {
    scenario_key: 'revertedLiberalization',
    phases: [
      {
        title_key: 'scenarioPhases.revertedLiberalization.phases.0.title',
        description_key: 'scenarioPhases.revertedLiberalization.phases.0.description',
        phase_label_key: 'scenarioPhases.revertedLiberalization.phases.0.phase',
      },
      {
        title_key: 'scenarioPhases.revertedLiberalization.phases.1.title',
        description_key: 'scenarioPhases.revertedLiberalization.phases.1.description',
        phase_label_key: 'scenarioPhases.revertedLiberalization.phases.1.phase',
      },
      {
        title_key: 'scenarioPhases.revertedLiberalization.phases.2.title',
        description_key: 'scenarioPhases.revertedLiberalization.phases.2.description',
        phase_label_key: 'scenarioPhases.revertedLiberalization.phases.2.phase',
      },
      {
        title_key: 'scenarioPhases.revertedLiberalization.phases.3.title',
        description_key: 'scenarioPhases.revertedLiberalization.phases.3.description',
        phase_label_key: 'scenarioPhases.revertedLiberalization.phases.3.phase',
      },
      {
        title_key: 'scenarioPhases.revertedLiberalization.phases.4.title',
        description_key: 'scenarioPhases.revertedLiberalization.phases.4.description',
        phase_label_key: 'scenarioPhases.revertedLiberalization.phases.4.phase',
      },
    ],
  },
  {
    scenario_key: 'regressedAutocracy',
    phases: [
      {
        title_key: 'scenarioPhases.regressedAutocracy.phases.0.title',
        description_key: 'scenarioPhases.regressedAutocracy.phases.0.description',
        phase_label_key: 'scenarioPhases.regressedAutocracy.phases.0.phase',
      },
      {
        title_key: 'scenarioPhases.regressedAutocracy.phases.1.title',
        description_key: 'scenarioPhases.regressedAutocracy.phases.1.description',
        phase_label_key: 'scenarioPhases.regressedAutocracy.phases.1.phase',
      },
      {
        title_key: 'scenarioPhases.regressedAutocracy.phases.2.title',
        description_key: 'scenarioPhases.regressedAutocracy.phases.2.description',
        phase_label_key: 'scenarioPhases.regressedAutocracy.phases.2.phase',
      },
      {
        title_key: 'scenarioPhases.regressedAutocracy.phases.3.title',
        description_key: 'scenarioPhases.regressedAutocracy.phases.3.description',
        phase_label_key: 'scenarioPhases.regressedAutocracy.phases.3.phase',
      },
      {
        title_key: 'scenarioPhases.regressedAutocracy.phases.4.title',
        description_key: 'scenarioPhases.regressedAutocracy.phases.4.description',
        phase_label_key: 'scenarioPhases.regressedAutocracy.phases.4.phase',
      },
    ],
  },
]

/**
 * Get timeline phases for a specific scenario
 */
export function getScenarioTimeline(scenarioKey: string): ScenarioTimeline | undefined {
  return scenarioTimelines.find(st => st.scenario_key === scenarioKey)
}
