import { getInstantServices } from "../src/app/_actions/services/getInstantServices";
import { getClientProjectId } from "../src/utils/project-resolver";

async function testAction() {
    try {
        console.log("Calling getClientProjectId()...");
        const projectId = await getClientProjectId();
        console.log("RESOLVED PROJECT ID:", projectId);

        console.log("Calling getInstantServices()...");
        const services = await getInstantServices();
        console.log(`TOTAL SERVICES: ${services.length}`);
        if (services.length > 0) {
            console.log("FIRST SERVICE SAMPLE:");
            console.log(JSON.stringify(services[0], null, 2));
        }
    } catch (e) {
        console.error("Error in test action:", e);
    }
}

testAction();
