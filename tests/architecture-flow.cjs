const assert=require('node:assert/strict');
module.exports=async function architectureFlow(page,{taskTitle,screenshotPath}={}){
 await page.locator('nav [data-nav="architectures"]').click();
 await page.locator('#arch-create').click();await page.locator('#architecture-dialog [name="title"]').fill('Arquitetura de pedidos');await page.locator('#architecture-dialog [name="description"]').fill('Aplicação, persistência e contexto de integração.');
 if(taskTitle)await page.locator('#architecture-dialog [name="taskId"]').selectOption({label:taskTitle});
 await page.locator('#architecture-dialog button[type="submit"]').click();
 await page.locator('[data-component="service"]').click();await page.locator('#arch-item-edit').click();await page.locator('#architecture-dialog [name="label"]').fill('API de pedidos');await page.locator('#architecture-dialog [name="technology"]').fill('Node.js');await page.locator('#architecture-dialog button[type="submit"]').click();
 await page.locator('[data-component="database"]').click();await page.locator('#arch-item-edit').click();await page.locator('#architecture-dialog [name="label"]').fill('Pedidos');await page.locator('#architecture-dialog [name="technology"]').fill('PostgreSQL');await page.locator('#architecture-dialog button[type="submit"]').click();
 await page.locator('[data-library="AWS"]').click();await page.locator('#arch-search').fill('Lambda');
 assert(await page.locator('[data-component]').count()>0);
 await page.locator('[data-component]').first().click();assert.equal(await page.locator('[data-node]').count(),3);
 await page.locator('#arch-item-delete').click();await page.locator('#yes').click();
 await page.locator('[data-library="Básicos"]').click();await page.locator('#arch-search').fill('');
 assert.equal(await page.locator('[data-node]').count(),2);
 await page.locator('#arch-connect').click();await page.locator('[data-node]').first().click();await page.locator('[data-node]').nth(1).click();assert.equal(await page.locator('[data-edge]').count(),1);
 await page.locator('#arch-item-edit').click();await page.locator('#architecture-dialog [name="label"]').fill('SQL');await page.locator('#architecture-dialog button[type="submit"]').click();
 const first=page.locator('[data-node]').first(),before=await first.getAttribute('transform'),box=await first.boundingBox();await first.scrollIntoViewIfNeeded();const actualBox=await first.boundingBox();box.x=actualBox.x;box.y=actualBox.y;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2+65,{steps:5});await page.mouse.up();assert.notEqual(await first.getAttribute('transform'),before);
 await page.locator('#arch-comment').fill('Separar a leitura da escrita na próxima revisão.');await page.locator('#arch-comment-form button').click();await page.locator('.arch-comment').filter({hasText:'Separar a leitura'}).waitFor();
 await page.locator('[data-comment-edit]').click();await page.locator('#architecture-dialog textarea').fill('Rever a política de retenção dos pedidos.');await page.locator('#architecture-dialog button[type="submit"]').click();
 if(screenshotPath)await page.screenshot({path:screenshotPath,animations:'disabled'});
 if(taskTitle){await page.locator('nav [data-nav="tasks"]').click();await page.locator('[data-task-view="all"]').click();await page.locator('[data-open-architecture]').first().click();await page.getByRole('heading',{name:'Arquitetura de pedidos',exact:true}).waitFor();}
 await page.locator('[data-node]').nth(1).click();await page.locator('#arch-item-delete').click();await page.locator('#yes').click();assert.equal(await page.locator('[data-node]').count(),1);assert.equal(await page.locator('[data-edge]').count(),0);
 await page.locator('#arch-back').click();await page.locator('#arch-create').click();await page.locator('#architecture-dialog [name="title"]').fill('Projeto temporário');await page.locator('#architecture-dialog button[type="submit"]').click();await page.locator('#arch-back').click();
 const temporary=page.locator('.arch-projects .card').filter({hasText:'Projeto temporário'});await temporary.locator('[data-arch-delete]').click();await page.locator('#yes').click();await temporary.waitFor({state:'detached'});
 await page.locator('[data-arch-open]').click();assert.equal(await page.locator('[data-node]').count(),1);assert.equal(await page.locator('.arch-comment').count(),1);
};
