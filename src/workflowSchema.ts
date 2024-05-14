export type WorkflowNode = {
// TODO
}
export type WorkflowData = {
    nodes: WorkflowNode[];
    last_node_id?: number;
    last_link_id?: number;
    links?: (string | number)[][];
    groups?: any[]; config?: {}; extra?: {
        groupNodes: { testerror: {} }
    }; version?: number;
}