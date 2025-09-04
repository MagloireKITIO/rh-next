import { Injectable } from '@nestjs/common';
import { AutomationCondition, ConditionOperator, ConditionLogic } from '../entities/automation-condition.entity';

@Injectable()
export class ConditionEvaluatorService {
  
  /**
   * Évaluer toutes les conditions d'une automatisation
   */
  evaluateConditions(conditions: AutomationCondition[], entity: any): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // Pas de conditions = toujours vrai
    }

    // Trier par ordre
    const sortedConditions = conditions.sort((a, b) => a.order - b.order);
    
    let result = this.evaluateSingleCondition(sortedConditions[0], entity);

    for (let i = 1; i < sortedConditions.length; i++) {
      const condition = sortedConditions[i];
      const conditionResult = this.evaluateSingleCondition(condition, entity);
      const previousCondition = sortedConditions[i - 1];

      if (previousCondition.logic === ConditionLogic.AND) {
        result = result && conditionResult;
      } else if (previousCondition.logic === ConditionLogic.OR) {
        result = result || conditionResult;
      }
    }

    return result;
  }

  /**
   * Évaluer une condition individuelle
   */
  private evaluateSingleCondition(condition: AutomationCondition, entity: any): boolean {
    const fieldValue = this.getFieldValue(entity, condition.field_path);
    
    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === condition.value;
      
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== condition.value;
      
      case ConditionOperator.CONTAINS:
        return typeof fieldValue === 'string' && 
               typeof condition.value === 'string' &&
               fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      
      case ConditionOperator.NOT_CONTAINS:
        return typeof fieldValue === 'string' && 
               typeof condition.value === 'string' &&
               !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(condition.value);
      
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(condition.value);
      
      case ConditionOperator.GREATER_EQUAL:
        return Number(fieldValue) >= Number(condition.value);
      
      case ConditionOperator.LESS_EQUAL:
        return Number(fieldValue) <= Number(condition.value);
      
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      
      case ConditionOperator.IN:
        return Array.isArray(condition.value) && 
               condition.value.includes(fieldValue);
      
      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) && 
               !condition.value.includes(fieldValue);
      
      default:
        console.warn(`Opérateur non supporté: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Récupérer la valeur d'un champ via un chemin (ex: 'project.name', 'status')
   */
  private getFieldValue(entity: any, fieldPath: string): any {
    if (!entity || !fieldPath) {
      return undefined;
    }

    const paths = fieldPath.split('.');
    let value = entity;

    for (const path of paths) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[path];
    }

    return value;
  }

  /**
   * Valider la structure d'une condition
   */
  validateCondition(condition: Partial<AutomationCondition>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!condition.field_path) {
      errors.push('Le chemin du champ est requis');
    }

    if (!condition.operator) {
      errors.push('L\'opérateur est requis');
    }

    // Vérifier si une valeur est requise pour l'opérateur
    if (condition.operator && this.operatorRequiresValue(condition.operator)) {
      if (condition.value === null || condition.value === undefined) {
        errors.push('Une valeur est requise pour cet opérateur');
      }
    }

    // Vérifier les types pour les opérateurs numériques
    if (condition.operator && this.isNumericOperator(condition.operator)) {
      if (isNaN(Number(condition.value))) {
        errors.push('Une valeur numérique est requise pour cet opérateur');
      }
    }

    // Vérifier les arrays pour IN/NOT_IN
    if (condition.operator && this.isArrayOperator(condition.operator)) {
      if (!Array.isArray(condition.value)) {
        errors.push('Un tableau de valeurs est requis pour cet opérateur');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private operatorRequiresValue(operator: ConditionOperator): boolean {
    return ![
      ConditionOperator.IS_NULL,
      ConditionOperator.IS_NOT_NULL
    ].includes(operator);
  }

  private isNumericOperator(operator: ConditionOperator): boolean {
    return [
      ConditionOperator.GREATER_THAN,
      ConditionOperator.LESS_THAN,
      ConditionOperator.GREATER_EQUAL,
      ConditionOperator.LESS_EQUAL
    ].includes(operator);
  }

  private isArrayOperator(operator: ConditionOperator): boolean {
    return [
      ConditionOperator.IN,
      ConditionOperator.NOT_IN
    ].includes(operator);
  }
}