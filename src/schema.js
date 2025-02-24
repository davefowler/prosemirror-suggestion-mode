import {Schema} from "prosemirror-model"
import {schema as basicSchema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"

// Create the schema by extending the basic schema
export const schema = new Schema({
    nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
    marks: basicSchema.spec.marks
})
