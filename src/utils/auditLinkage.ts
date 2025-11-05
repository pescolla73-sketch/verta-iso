import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Check if all controls related to a risk are verified
 */
export const checkAllControlsVerified = async (
  controlRefs: string[],
  orgId: string
): Promise<boolean> => {
  if (!controlRefs || controlRefs.length === 0) return false;

  const { data } = await supabase
    .from('soa_items')
    .select('implementation_status')
    .eq('organization_id', orgId)
    .in('control_reference', controlRefs);

  return data?.every(item => item.implementation_status === 'verified') || false;
};

/**
 * Main function to update all linked modules after audit completion
 */
export const updateLinkedModules = async (
  auditId: string,
  auditData: any,
  checklistItems: any[]
) => {
  console.log('🔍 [Audit Complete] Starting cross-module updates...');

  let updatedCount = 0;
  let risksUpdated = 0;
  let ncClosed = 0;
  let ncCreated = 0;

  const orgId = auditData.organization_id;

  for (const item of checklistItems) {
    // Skip if update_linked is false
    if (item.update_linked === false) continue;

    try {
      if (item.result === 'conforming') {
        // ========== CONFORMING RESULT ==========
        console.log(`✅ [Processing] Control ${item.control_reference} - CONFORMING`);

        // 1. GET SoA ITEM
        const { data: soaItem } = await supabase
          .from('soa_items')
          .select('id, related_risks, evidence_documents')
          .eq('organization_id', orgId)
          .eq('control_reference', item.control_reference)
          .maybeSingle();

        if (soaItem) {
          // 2. UPDATE SoA
          const existingEvidences = Array.isArray(soaItem.evidence_documents)
            ? soaItem.evidence_documents
            : [];

          const nextReviewDate = new Date(auditData.audit_date);
          nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);

          await supabase
            .from('soa_items')
            .update({
              implementation_status: 'verified',
              last_audit_date: auditData.audit_date,
              last_audit_result: 'conforming',
              last_audit_id: auditId,
              verified_by: auditData.auditor_name,
              compliance_score: 100,
              next_review_date: nextReviewDate.toISOString().split('T')[0],
              evidence_documents: [
                ...existingEvidences,
                {
                  type: 'audit_report',
                  audit_id: auditId,
                  audit_code: auditData.audit_code,
                  date: auditData.audit_date,
                  result: 'conforming',
                  auditor: auditData.auditor_name
                }
              ]
            })
            .eq('id', soaItem.id);

          console.log(`✅ [SoA] Updated control ${item.control_reference} → verified`);
          updatedCount++;

          // 3. UPDATE RELATED RISKS
          if (soaItem.related_risks && soaItem.related_risks.length > 0) {
            for (const riskId of soaItem.related_risks) {
              const { data: risk } = await supabase
                .from('risks')
                .select('inherent_risk_score, related_controls')
                .eq('id', riskId)
                .maybeSingle();

              if (risk) {
                // Check if ALL controls of this risk are verified
                const allControlsVerified = await checkAllControlsVerified(
                  risk.related_controls || [],
                  orgId
                );

                if (allControlsVerified) {
                  // Reduce risk score significantly (-60%)
                  const newScore = Math.max(1, Math.floor(risk.inherent_risk_score * 0.4));

                  await supabase
                    .from('risks')
                    .update({
                      residual_risk_score: newScore,
                      verification_status: 'verified',
                      last_verification_date: auditData.audit_date,
                      verification_audit_id: auditId,
                      notes: `Controlli verificati conformi in audit ${auditData.audit_code}. Score ridotto da ${risk.inherent_risk_score} a ${newScore}.`
                    })
                    .eq('id', riskId);

                  console.log(`✅ [Risk] Risk ${riskId} score ${risk.inherent_risk_score} → ${newScore}`);
                  risksUpdated++;
                }
              }
            }
          }

          // 4. UPDATE ISO CONTROLS TABLE
          // Get existing audit history
          const { data: existingControl } = await supabase
            .from('controls')
            .select('audit_history')
            .eq('control_id', item.control_reference)
            .maybeSingle();

          const existingHistory = Array.isArray(existingControl?.audit_history)
            ? existingControl.audit_history
            : [];

          await supabase
            .from('controls')
            .update({
              status: 'implemented',
              last_audit_date: auditData.audit_date,
              last_audit_result: 'conforming',
              audit_history: [
                ...existingHistory,
                {
                  audit_id: auditId,
                  audit_code: auditData.audit_code,
                  date: auditData.audit_date,
                  result: 'conforming',
                  auditor: auditData.auditor_name
                }
              ]
            })
            .eq('control_id', item.control_reference);

          // 5. CLOSE RELATED NON-CONFORMITIES
          const { data: closedNCs } = await supabase
            .from('non_conformities')
            .update({
              status: 'closed',
              closed_at: auditData.audit_date,
              closure_notes: `Verificata risoluzione in audit ${auditData.audit_code}`,
              effectiveness_verified: true
            })
            .eq('related_control', item.control_reference)
            .eq('status', 'verification')
            .eq('organization_id', orgId)
            .select();

          if (closedNCs && closedNCs.length > 0) {
            ncClosed += closedNCs.length;
            console.log(`✅ [NC] Closed ${closedNCs.length} NC for control ${item.control_reference}`);
          }
        }
      } else if (item.result === 'non_conforming' && item.auto_create_nc) {
        // ========== NON-CONFORMING RESULT ==========
        console.log(`⚠️ [Processing] Control ${item.control_reference} - NON-CONFORMING`);

        // Create NC automatically
        await supabase
          .from('non_conformities')
          .insert({
            organization_id: orgId,
            nc_code: `NC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: `NC da Audit: ${item.control_title}`,
            description: `Controllo ${item.control_reference} trovato non conforme durante audit ${auditData.audit_code}.\n\nNote audit: ${item.audit_notes || 'Nessuna nota specifica'}`,
            source: 'audit',
            source_id: auditId,
            severity: 'major',
            status: 'open',
            related_control: item.control_reference,
            detection_method: 'internal_audit'
          });

        console.log(`⚠️ [NC] Created NC for control ${item.control_reference}`);
        ncCreated++;

        // Update SoA: back to "implemented" (no longer verified)
        await supabase
          .from('soa_items')
          .update({
            implementation_status: 'implemented',
            last_audit_date: auditData.audit_date,
            last_audit_result: 'non_conforming',
            compliance_score: 50
          })
          .eq('control_reference', item.control_reference)
          .eq('organization_id', orgId);

        console.log(`⚠️ [SoA] Control ${item.control_reference} → implemented (not verified)`);
      }
    } catch (error) {
      console.error(`⚠️ [Error] Failed to update control ${item.control_reference}:`, error);
      // Continue with other updates
    }
  }

  console.log('✨ [Complete] All modules updated successfully');
  console.log(`   - ${updatedCount} controlli verificati`);
  console.log(`   - ${risksUpdated} rischi ridotti`);
  console.log(`   - ${ncClosed} NC chiuse`);
  console.log(`   - ${ncCreated} NC create`);

  // Show success toast
  toast({
    title: 'Moduli Aggiornati',
    description: `${updatedCount} controlli verificati, ${risksUpdated} rischi ridotti, ${ncClosed} NC chiuse, ${ncCreated} NC create.`,
  });

  return {
    updatedCount,
    risksUpdated,
    ncClosed,
    ncCreated
  };
};

/**
 * Get suggested controls to audit based on SoA, risks, and NC
 */
export const getSmartSuggestions = async (orgId: string) => {
  const suggestions = {
    toVerify: [] as any[],
    highRisks: [] as any[],
    ncToVerify: [] as any[]
  };

  try {
    // 1. CONTROLS TO VERIFY (implemented but not verified)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    const { data: toVerify } = await supabase
      .from('soa_items')
      .select(`
        *,
        risks!inner(
          id,
          name,
          inherent_risk_score
        )
      `)
      .eq('organization_id', orgId)
      .eq('applicability', 'applicable')
      .eq('implementation_status', 'implemented')
      .or(`last_audit_date.is.null,last_audit_date.lt.${oneYearAgoStr}`)
      .order('implementation_date', { ascending: true })
      .limit(10);

    suggestions.toVerify = toVerify || [];

    // 2. HIGH RISKS NOT VERIFIED
    const { data: highRisks } = await supabase
      .from('risks')
      .select(`
        *,
        soa_items!inner(
          control_reference,
          control_title,
          implementation_status
        )
      `)
      .eq('organization_id', orgId)
      .gte('inherent_risk_score', 12)
      .eq('verification_status', 'not_verified')
      .order('inherent_risk_score', { ascending: false })
      .limit(10);

    suggestions.highRisks = highRisks || [];

    // 3. NC WITH COMPLETED ACTIONS
    const { data: ncToVerify } = await supabase
      .from('non_conformities')
      .select(`
        *,
        soa_items(
          control_reference,
          control_title
        )
      `)
      .eq('organization_id', orgId)
      .eq('status', 'verification')
      .order('created_at', { ascending: false })
      .limit(10);

    suggestions.ncToVerify = ncToVerify || [];

  } catch (error) {
    console.error('Error loading smart suggestions:', error);
  }

  return suggestions;
};
